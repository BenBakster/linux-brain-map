#!/usr/bin/env bash
# log_analyzer.sh — анализ журналов безопасности
# Модули: 06-memory, 08-ipc, 11-networking, 12-security

set -euo pipefail

LOG_FILE=""
SINCE=""
JSON=0

# Инициализация JSON переменных
JSON_METRICS="{}"
JSON_TOP_IPS="[]"

usage() {
    echo "Использование: $0 <logfile> [опции]"
    echo "  или: $0 --journal [опции]"
    echo "Опции:"
    echo "  --since 'time'   Временной диапазон для journalctl (например, '1 hour ago')"
    echo "  --json           Вывод результатов в формате структурированного JSON"
    echo "  -h, --help       Показать эту справку"
    exit 1
}

# Корректный разбор аргументов
while [[ $# -gt 0 ]]; do
    case "$1" in
        --json) JSON=1; shift ;;
        --since)
            if [[ -z "${2:-}" ]]; then
                echo "Ошибка: --since требует указания значения" >&2
                exit 1
            fi
            SINCE="$2"; shift 2 ;;
        --journal) LOG_FILE="__journal__"; shift ;;
        -h|--help) usage ;;
        *)
            if [[ -z "$LOG_FILE" ]]; then
                LOG_FILE="$1"
            else
                echo "Ошибка: указано несколько лог-файлов" >&2
                usage
            fi
            shift ;;
    esac
done

if [[ -z "$LOG_FILE" ]]; then
    echo "Ошибка: не указан файл лога или флаг --journal" >&2
    usage
fi

alert() {
    local count="$1" pattern="$2"
    if [[ "$count" -gt 0 && "$JSON" -eq 0 ]]; then
        echo "[!] $pattern: $count"
    fi
}

section() {
    [[ "$JSON" -eq 1 ]] && return
    echo
    echo "=== $1 ==="
}

analyze_data() {
    local file="$1"
    local source_name="$2"
    section "Анализ: $source_name"

    # SSH failed
    local ssh_fail
    ssh_fail=$(grep -cE 'Failed password|Invalid user|authentication failure' "$file" 2>/dev/null || echo 0)
    alert "$ssh_fail" "SSH/auth failures"

    # Accepted logins
    local ssh_ok
    ssh_ok=$(grep -cE 'Accepted (password|publickey)|session opened' "$file" 2>/dev/null || echo 0)
    alert "$ssh_ok" "Успешные входы"

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
    top_ips_arr=()
    while read -r count ip; do
        if [[ "$JSON" -eq 0 ]]; then
            echo "    $ip: $count"
        else
            top_ips_arr+=("{\"ip\":\"$ip\",\"count\":$count}")
        fi
    done < <(grep -E 'Failed password|Invalid user' "$file" 2>/dev/null \
        | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' \
        | sort | uniq -c | sort -rn | head -10 || true)

    if [[ ${#top_ips_arr[@]} -eq 0 && "$JSON" -eq 0 ]]; then
        echo "    нет данных"
    fi

    # Формируем JSON строки
    if [[ "$JSON" -eq 1 ]]; then
        JSON_METRICS="{\"ssh_failures\":$ssh_fail,\"accepted_logins\":$ssh_ok,\"sudo_failures\":$sudo_fail,\"oom_events\":$oom}"
        if [[ ${#top_ips_arr[@]} -gt 0 ]]; then
            JSON_TOP_IPS=$(printf ",%s" "${top_ips_arr[@]}")
            JSON_TOP_IPS="[${JSON_TOP_IPS:1}]"
        fi
    fi
}

# Основная логика выбора источника
if [[ "$LOG_FILE" == "__journal__" ]]; then
    if ! command -v journalctl &>/dev/null; then
        echo "Ошибка: journalctl не найден" >&2
        exit 1
    fi
    
    # Создаем временный файл для сброса логов
    tmp_journal=$(mktemp)
    trap 'rm -f "$tmp_journal"' EXIT

    journal_args=()
    [[ -n "$SINCE" ]] && journal_args+=(--since "$SINCE")
    
    # Сбрасываем весь лог во временный файл
    journalctl "${journal_args[@]}" > "$tmp_journal" 2>/dev/null || {
        echo "Ошибка при выполнении journalctl" >&2
        exit 1
    }

    # Показываем последние 50 предупреждений в текстовом режиме
    if [[ "$JSON" -eq 0 ]]; then
        section "Последние предупреждения из journalctl"
        journalctl "${journal_args[@]}" -p warning..alert --no-pager 2>/dev/null | tail -50 || true
    fi

    analyze_data "$tmp_journal" "systemd-journal"
else
    if [[ -r "$LOG_FILE" ]]; then
        analyze_data "$LOG_FILE" "$LOG_FILE"
    else
        echo "Ошибка: не могу прочитать лог-фаль $LOG_FILE" >&2
        exit 1
    fi
fi

section "Готово"

if [[ "$JSON" -eq 1 ]]; then
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat <<EOF
{
  "timestamp": "$TIMESTAMP",
  "source": "$LOG_FILE",
  "since": "${SINCE:-all}",
  "metrics": $JSON_METRICS,
  "top_failed_ips": $JSON_TOP_IPS
}
EOF
fi