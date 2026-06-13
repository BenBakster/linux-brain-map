#!/usr/bin/env bash
# hash_checker.sh — контроль целостности файлов (SHA-256)
# Модули: 09-filesystems, 10-block-io, 12-security

set -euo pipefail

MODE="scan"
TARGET=""
BASELINE=""

usage() {
    echo "Использование:"
    echo "  $0 <directory>              — хеши критичных файлов"
    echo "  $0 --baseline <dir>         — сохранить baseline (stdout)"
    echo "  $0 --check <baseline.sha>   — сравнить с baseline"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --baseline) MODE="baseline"; TARGET="$2"; shift 2 ;;
        --check) MODE="check"; BASELINE="$2"; shift 2 ;;
        -h|--help) usage ;;
        *) TARGET="$1"; shift ;;
    esac
done

# Критичные пути для baseline
CRITICAL_PATHS=(
    /etc/passwd
    /etc/shadow
    /etc/group
    /etc/sudoers
    /etc/ssh/sshd_config
    /etc/crontab
)

hash_file() {
    local f="$1"
    [[ -r "$f" ]] && sha256sum "$f"
}

scan_dir() {
    local dir="$1"
    echo "=== SHA-256: $dir ==="
    find "$dir" -maxdepth 2 -type f \( \
        -name "*.conf" -o -name "passwd" -o -name "shadow" -o -name "sudoers" \
        -o -name "sshd_config" -o -name "crontab" \
    \) -readable 2>/dev/null | sort | while read -r f; do
        hash_file "$f"
    done
}

create_baseline() {
    local dir="$1"
    for f in "${CRITICAL_PATHS[@]}"; do
        hash_file "$f"
    done
    [[ -d "$dir" ]] && find "$dir" -maxdepth 1 -type f -readable 2>/dev/null | sort | while read -r f; do
        hash_file "$f"
    done
}

check_baseline() {
    local baseline="$1"
    local changed=0 missing=0

    echo "=== Проверка baseline: $baseline ==="
    while read -r expected_hash path; do
        [[ -z "$path" ]] && continue
        if [[ ! -r "$path" ]]; then
            echo "[!] ОТСУТСТВУЕТ: $path"
            ((missing++)) || true
            continue
        fi
        local current_hash
        current_hash=$(sha256sum "$path" | awk '{print $1}')
        if [[ "$current_hash" != "$expected_hash" ]]; then
            echo "[!] ИЗМЕНЁН: $path"
            echo "    было: $expected_hash"
            echo "    стало: $current_hash"
            ((changed++)) || true
        else
            echo "[ok] $path"
        fi
    done < "$baseline"

    echo
    echo "Итого: изменено=$changed отсутствует=$missing"
    [[ "$changed" -gt 0 || "$missing" -gt 0 ]] && exit 1
}

case "$MODE" in
    scan)
        [[ -z "$TARGET" ]] && usage
        scan_dir "$TARGET"
        ;;
    baseline)
        [[ -z "$TARGET" ]] && usage
        create_baseline "$TARGET"
        ;;
    check)
        [[ -z "$BASELINE" || ! -f "$BASELINE" ]] && usage
        check_baseline "$BASELINE"
        ;;
esac