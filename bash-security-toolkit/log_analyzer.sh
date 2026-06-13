#!/usr/bin/env bash
# log_analyzer.sh — анализ журналов безопасности
# Модули: 06-memory, 08-ipc, 11-networking, 12-security

set -euo pipefail

LOG_FILE=""
SINCE=""
JSON=0

usage() {
    echo "Использование: $0 <logfile> [--since '1 hour ago'] [--json]"
    echo "  или: $0 --journal [--since 'today'] [--json]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json) JSON=1; shift ;;
        --since) SINCE="$2"; shift 2 ;;
        --journal) LOG_FILE="__journal__"; shift ;;
        -h|--help) usage ;;
        *) LOG_FILE="$1"; shift ;;
    esac
done

[[ -z "$LOG_FILE" ]] && usage

alert() {
    local count="$1" pattern="$2"
    if [[ "$count" -gt 0 ]]; then
        if [[ "$JSON" -eq 1 ]]; then
            echo "ALERT|$pattern|$count"
        else
            echo "[!] $pattern: $count"
        fi
    fi
}

section() {
    [[ "$JSON" -eq 1 ]] && return
    echo
    echo "=== $1 ==="
}

analyze_file() {
    local file="$1"
    section "Анализ: $file"

    # SSH failed
    local ssh_fail
    ssh_fail=$(grep -cE 'Failed password|Invalid user|authentication failure' "$file" 2>/dev/null || echo 0)
    alert "$ssh_fail" "SSH/auth failures"

    # Accepted logins
    local ssh_ok
    ssh_ok=$(grep -cE 'Accepted (password|publickey)|session opened' "$file" 2>/dev/null || echo 0)
    alert "$ssh_ok" "Успешные входы (проверь незнакомые IP)"

    # sudo
    local sudo_fail
    sudo_fail=$(grep -cE 'sudo:.*authentication failure|NOT allowed' "$file" 2>/dev/null || echo 0)
    alert "$sudo_fail" "Sudo failures"

    # OOM (модуль 06)
    local oom
    oom=$(grep -ciE 'out of memory|oom.killer|killed process' "$file" 2>/dev/null || echo 0)
    alert "$oom" "OOM Killer events"

    # Топ IP с failed SSH
    section "Топ IP (failed SSH)"
    grep -E 'Failed password|Invalid user' "$file" 2>/dev/null \
        | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' \
        | sort | uniq -c | sort -rn | head -10 || echo "    нет данных"
}

analyze_journal() {
    section "Анализ: journalctl"
    local args=(--no-pager -p warning..alert)
    [[ -n "$SINCE" ]] && args+=(--since "$SINCE")

    journalctl "${args[@]}" 2>/dev/null | tail -50 || warn_journal

    local ssh_fail
    ssh_fail=$(journalctl "${args[@]}" 2>/dev/null | grep -cE 'Failed password|Invalid user' || echo 0)
    alert "$ssh_fail" "SSH failures (journal)"
}

warn_journal() {
    echo "    journalctl недоступен"
}

if [[ "$LOG_FILE" == "__journal__" ]]; then
    analyze_journal
elif [[ -r "$LOG_FILE" ]]; then
    analyze_file "$LOG_FILE"
else
    echo "Ошибка: не могу прочитать $LOG_FILE" >&2
    exit 1
fi

section "Готово"