#!/usr/bin/env bash
# port_scanner.sh — аудит открытых портов
# Модули: 11-networking, 12-security

set -euo pipefail

TARGET=""
TOP_PORTS=50
JSON=0

usage() {
    echo "Использование: $0 <host> [--top-ports N] [--json]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --top-ports) TOP_PORTS="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        -h|--help) usage ;;
        *) TARGET="$1"; shift ;;
    esac
done

[[ -z "$TARGET" ]] && usage

section() {
    [[ "$JSON" -eq 1 ]] && return
    echo
    echo "=== $1 ==="
}

# Локальные listening-порты через ss
section "Listening (ss) — эталон"
if command -v ss &>/dev/null; then
    ss -tulnp 2>/dev/null || ss -tuln
else
    echo "ss не найден"
fi

# Сканирование
section "Сканирование: $TARGET (top $TOP_PORTS)"

if command -v nmap &>/dev/null; then
    nmap -sT -T4 --top-ports "$TOP_PORTS" "$TARGET" 2>/dev/null
else
    echo "nmap не установлен — используем bash /dev/tcp"
    common_ports=(22 80 443 21 25 53 110 143 445 3306 3389 5432 8080 8443 631 111 2049 5900)
    open_ports=()
    for port in "${common_ports[@]}"; do
        if timeout 1 bash -c "echo >/dev/tcp/$TARGET/$port" 2>/dev/null; then
            open_ports+=("$port")
            if [[ "$JSON" -eq 1 ]]; then
                echo "OPEN|$port"
            else
                echo "  OPEN: $port/tcp"
            fi
        fi
    done
    [[ ${#open_ports[@]} -eq 0 ]] && echo "  (из проверенных — открытых нет)"
fi

# Рекомендации
section "Чеклист (модуль 11: STN)"
cat <<'EOF'
  [ ] 22 (SSH) — только ключи, не root login
  [ ] 80/443 — актуальные TLS, нет default creds
  [ ] 3306/5432 — не слушать 0.0.0.0
  [ ] 3389 — RDP закрыт с интернета
  [ ] Неожиданные порты — расследовать (ss -tulnp)
EOF

section "Готово"