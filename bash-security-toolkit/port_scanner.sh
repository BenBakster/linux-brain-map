#!/usr/bin/env bash
# port_scanner.sh — аудит открытых портов
# Модули: 11-networking, 12-security

set -euo pipefail

TARGET=""
TOP_PORTS=50
JSON=0

usage() {
    echo "Использование: $0 <host> [опции]"
    echo "Опции:"
    echo "  --top-ports N   Сканировать N самых популярных портов (по умолчанию 50)"
    echo "  --json          Вывод результатов в формате структурированного JSON"
    echo "  -h, --help      Показать эту справку"
    exit 1
}

# Разбор аргументов
while [[ $# -gt 0 ]]; do
    case "$1" in
        --top-ports)
            if [[ -z "${2:-}" ]]; then
                echo "Ошибка: --top-ports требует числового значения" >&2
                exit 1
            fi
            TOP_PORTS="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        -h|--help) usage ;;
        *)
            if [[ -z "$TARGET" ]]; then
                TARGET="$1"
            else
                echo "Ошибка: указано несколько хостов" >&2
                usage
            fi
            shift ;;
    esac
done

if [[ -z "$TARGET" ]]; then
    echo "Ошибка: не указан целевой хост" >&2
    usage
fi

section() {
    [[ "$JSON" -eq 1 ]] && return
    echo
    echo "=== $1 ==="
}

# Локальные listening-порты через ss
section "Listening (ss) — эталон"
local_ss_output=""
if command -v ss &>/dev/null; then
    # ss требует root для флага -p
    local_ss_output=$(ss -tuln 2>/dev/null || true)
    if [[ "$JSON" -eq 0 ]]; then
        ss -tulnp 2>/dev/null || ss -tuln || echo "ss не сработал"
    fi
else
    [[ "$JSON" -eq 0 ]] && echo "ss не найден"
fi

# Сканирование
section "Сканирование: $TARGET (top $TOP_PORTS)"

SCANNER="bash"
OPEN_PORTS_JSON="[]"
open_ports=()

# Список популярных портов в порядке частоты/важности
all_common_ports=(
    22 80 443 21 25 53 110 143 445 3306 3389 5432 8080 8443 631 111 2049 5900 # Top 18
    8081 9000 23 135 139 161 993 995 1723 88 389 465 587 990 1080 1433 1521 3128 3268 # More common
    5000 5060 5672 5984 6379 8000 8082 8888 9200 11211 27017 # Databases & APIs
)

if command -v nmap &>/dev/null; then
    SCANNER="nmap"
    # Запуск nmap и парсинг вывода
    nmap_out=$(nmap -sT -T4 --top-ports "$TOP_PORTS" "$TARGET" 2>/dev/null || true)
    
    if [[ "$JSON" -eq 0 ]]; then
        echo "$nmap_out"
    else
        # В режиме JSON парсим nmap_out для поиска открытых портов
        while read -r line; do
            if [[ "$line" =~ ^[0-9]+/tcp[[:space:]]+open ]]; then
                port=$(echo "$line" | cut -d/ -f1)
                open_ports+=("$port")
            fi
        done <<< "$nmap_out"
    fi
else
    SCANNER="bash"
    [[ "$JSON" -eq 0 ]] && echo "nmap не установлен — используем bash /dev/tcp"
    
    # Срезаем массив портов до размера TOP_PORTS
    ports_to_scan=("${all_common_ports[@]:0:$TOP_PORTS}")
    
    for port in "${ports_to_scan[@]}"; do
        # Быстрый таймаут в 1 секунду для локальных/быстрых сетей
        if timeout 1 bash -c "echo >/dev/tcp/$TARGET/$port" 2>/dev/null; then
            open_ports+=("$port")
            if [[ "$JSON" -eq 0 ]]; then
                echo "  OPEN: $port/tcp"
            fi
        fi
    done
    
    if [[ "$JSON" -eq 0 && ${#open_ports[@]} -eq 0 ]]; then
        echo "  (из проверенных — открытых нет)"
    fi
fi

# Рекомендации
if [[ "$JSON" -eq 0 ]]; then
    section "Чеклист (модуль 11: STN)"
    cat <<'EOF'
  [ ] 22 (SSH) — только ключи, не root login
  [ ] 80/443 — актуальные TLS, нет default creds
  [ ] 3306/5432 — не слушать 0.0.0.0
  [ ] 3389 — RDP закрыт с интернета
  [ ] Неожиданные порты — расследовать (ss -tulnp)
EOF
    section "Готово"
fi

# Вывод JSON
if [[ "$JSON" -eq 1 ]]; then
    # Сборка массива открытых портов
    if [[ ${#open_ports[@]} -gt 0 ]]; then
        OPEN_PORTS_JSON=$(printf ",%s" "${open_ports[@]}")
        OPEN_PORTS_JSON="[${OPEN_PORTS_JSON:1}]"
    fi
    
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat <<EOF
{
  "timestamp": "$TIMESTAMP",
  "target": "$TARGET",
  "top_ports_limit": $TOP_PORTS,
  "scanner": "$SCANNER",
  "open_ports": $OPEN_PORTS_JSON
}
EOF
fi