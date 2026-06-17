#!/usr/bin/env bash
# user_audit.sh — аудит пользователей, процессов, автозапуска
# Модули: 01-architecture, 02-boot, 04-processes, 05-scheduler, 07-sync, 12-security

set -euo pipefail

JSON=0
HELP=0

# Инициализация JSON полей
JSON_LOGIN_USERS="[]"
JSON_UID_ZERO="[]"
JSON_EMPTY_PASSWORDS="[]"
JSON_SUDO_RULES="[]"
JSON_ZOMBIES="[]"
JSON_TOP_CPU="[]"
JSON_D_STATE="[]"
JSON_SUID_SGID="[]"
JSON_CRON_JOBS="[]"
JSON_SYSTEMD_FAILED="[]"

usage() {
    echo "Использование: $0 [опции]"
    echo "Опции:"
    echo "  --json      Вывод результатов в формате структурированного JSON"
    echo "  -h, --help  Показать эту справку"
    exit 0
}

# Разбор аргументов
while [[ $# -gt 0 ]]; do
    case "$1" in
        --json) JSON=1; shift ;;
        -h|--help) usage ;;
        *) echo "Неизвестный параметр: $1" >&2; usage ;;
    esac
done

IS_ROOT=0
[[ $EUID -eq 0 ]] && IS_ROOT=1

section() {
    [[ "$JSON" -eq 1 ]] && return
    echo
    echo "=== $1 ==="
}

warn() {
    [[ "$JSON" -eq 1 ]] && return
    echo "[!] $1"
}

info() {
    [[ "$JSON" -eq 1 ]] && return
    echo "    $1"
}

# --- Проверка прав root ---
section "Проверка прав"
if [[ "$IS_ROOT" -eq 1 ]]; then
    info "Запущено с правами root"
else
    warn "Запуск без прав root. Некоторые проверки (/etc/shadow, /etc/sudoers) будут недоступны."
fi

# --- Пользователи с shell ---
section "Пользователи с login shell"
users_arr=()
while IFS=: read -r user _ uid gid _ home shell; do
    if [[ "$shell" == *sh || "$shell" == *fish || "$shell" == *tmux ]] && [[ "$uid" -ge 1000 || "$user" == "root" ]]; then
        info "$user (uid=$uid) shell=$shell home=$home"
        if [[ "$JSON" -eq 1 ]]; then
            # Экранирование кавычек
            users_arr+=("{\"user\":\"$user\",\"uid\":$uid,\"shell\":\"$shell\",\"home\":\"$home\"}")
        fi
    fi
done < /etc/passwd

if [[ "$JSON" -eq 1 && ${#users_arr[@]} -gt 0 ]]; then
    # Объединение массива
    JSON_LOGIN_USERS=$(printf ",%s" "${users_arr[@]}")
    JSON_LOGIN_USERS="[${JSON_LOGIN_USERS:1}]"
fi

# --- UID 0 кроме root ---
section "UID 0 (кроме root)"
uid_zero_arr=()
while IFS=: read -r user _ uid _; do
    if [[ "$uid" -eq 0 && "$user" != "root" ]]; then
        warn "СУПЕРПОЛЬЗОВАТЕЛЬ: $user"
        if [[ "$JSON" -eq 1 ]]; then
            uid_zero_arr+=("\"$user\"")
        fi
    fi
done < /etc/passwd

if [[ "$JSON" -eq 1 && ${#uid_zero_arr[@]} -gt 0 ]]; then
    JSON_UID_ZERO=$(printf ",%s" "${uid_zero_arr[@]}")
    JSON_UID_ZERO="[${JSON_UID_ZERO:1}]"
fi

# --- Пустые пароли ---
section "Аккаунты без пароля"
empty_pass_arr=()
if [[ -r /etc/shadow ]]; then
    while IFS=: read -r user pass _; do
        if [[ -z "$pass" || "$pass" == "!" || "$pass" == "*" ]]; then
            # Пропускаем системные аккаунты без пароля, если у них нет login shell
            shell=$(grep "^$user:" /etc/passwd | cut -d: -f7 || echo "/usr/sbin/nologin")
            if [[ "$shell" == *sh || "$shell" == *fish ]]; then
                warn "Пустой пароль: $user"
                if [[ "$JSON" -eq 1 ]]; then
                    empty_pass_arr+=("\"$user\"")
                fi
            fi
        fi
    done < /etc/shadow
else
    warn "Нет доступа к /etc/shadow (нужен root)"
fi

if [[ "$JSON" -eq 1 && ${#empty_pass_arr[@]} -gt 0 ]]; then
    JSON_EMPTY_PASSWORDS=$(printf ",%s" "${empty_pass_arr[@]}")
    JSON_EMPTY_PASSWORDS="[${JSON_EMPTY_PASSWORDS:1}]"
fi

# --- sudo ---
section "Правила sudo"
sudo_rules_arr=()
if [[ -r /etc/sudoers ]]; then
    while read -r line; do
        info "$line"
        if [[ "$JSON" -eq 1 ]]; then
            # Экранирование для JSON
            escaped=$(echo "$line" | sed 's/"/\\"/g')
            sudo_rules_arr+=("\"$escaped\"")
        fi
    done < <(grep -vE '^\s*#|^\s*$' /etc/sudoers 2>/dev/null | head -20 || true)
else
    warn "Нет доступа к /etc/sudoers"
fi

# Проверка каталога sudoers.d
if [[ -d /etc/sudoers.d ]]; then
    while read -r line; do
        if [[ "$JSON" -eq 0 ]]; then
            echo "    sudoers.d: $line"
        else
            escaped=$(echo "$line" | sed 's/"/\\"/g')
            sudo_rules_arr+=("\"sudoers.d: $escaped\"")
        fi
    done < <(ls -la /etc/sudoers.d/ 2>/dev/null | tail -n +2 || true)
fi

if [[ "$JSON" -eq 1 && ${#sudo_rules_arr[@]} -gt 0 ]]; then
    JSON_SUDO_RULES=$(printf ",%s" "${sudo_rules_arr[@]}")
    JSON_SUDO_RULES="[${JSON_SUDO_RULES:1}]"
fi

# --- Зомби ---
section "Zombie-процессы (модуль 04: FET)"
zombie_count=$(ps -eo stat | grep -c Z || true)
zombies_arr=()
if [[ "$zombie_count" -gt 0 ]]; then
    warn "Найдено zombie: $zombie_count"
    while read -r pid ppid stat cmd; do
        if [[ "$JSON" -eq 0 ]]; then
            echo "    PID=$pid PPID=$ppid STAT=$stat CMD=$cmd"
        else
            escaped_cmd=$(echo "$cmd" | sed 's/"/\\"/g')
            zombies_arr+=("{\"pid\":$pid,\"ppid\":$ppid,\"stat\":\"$stat\",\"cmd\":\"$escaped_cmd\"}")
        fi
    done < <(ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/ {print $1, $2, $3, $4}' || true)
else
    info "Zombie не обнаружены"
fi

if [[ "$JSON" -eq 1 && ${#zombies_arr[@]} -gt 0 ]]; then
    JSON_ZOMBIES=$(printf ",%s" "${zombies_arr[@]}")
    JSON_ZOMBIES="[${JSON_ZOMBIES:1}]"
fi

# --- Топ CPU ---
section "Топ-10 по CPU (модуль 05: CFS)"
top_cpu_arr=()
# Получаем заголовки и строки
while read -r user pid cpu mem cmd; do
    # Пропускаем заголовок
    [[ "$user" == "USER" ]] && continue
    if [[ "$JSON" -eq 0 ]]; then
        echo "    $user | $pid | CPU $cpu% | MEM $mem% | $cmd"
    else
        escaped_cmd=$(echo "$cmd" | sed 's/"/\\"/g')
        top_cpu_arr+=("{\"user\":\"$user\",\"pid\":$pid,\"cpu\":$cpu,\"mem\":$mem,\"cmd\":\"$escaped_cmd\"}")
    fi
done < <(ps aux --sort=-%cpu 2>/dev/null | head -11 || ps -eo user,pid,pcpu,pmem,comm --sort=-pcpu | head -11 || true)

if [[ "$JSON" -eq 1 && ${#top_cpu_arr[@]} -gt 0 ]]; then
    JSON_TOP_CPU=$(printf ",%s" "${top_cpu_arr[@]}")
    JSON_TOP_CPU="[${JSON_TOP_CPU:1}]"
fi

# --- Процессы в D state ---
section "Uninterruptible sleep (D) — модуль 07"
d_count=$(ps -eo stat | grep -c '^D' 2>/dev/null || true)
d_arr=()
if [[ "$d_count" -gt 0 ]]; then
    warn "Процессы в состоянии D: $d_count"
    while read -r pid stat cmd; do
        if [[ "$JSON" -eq 0 ]]; then
            echo "    PID=$pid STAT=$stat CMD=$cmd"
        else
            escaped_cmd=$(echo "$cmd" | sed 's/"/\\"/g')
            d_arr+=("{\"pid\":$pid,\"stat\":\"$stat\",\"cmd\":\"$escaped_cmd\"}")
        fi
    done < <(ps -eo pid,stat,cmd | awk '$2 ~ /D/ {print $1, $2, $3}' || true)
else
    info "Процессов в D нет"
fi

if [[ "$JSON" -eq 1 && ${#d_arr[@]} -gt 0 ]]; then
    JSON_D_STATE=$(printf ",%s" "${d_arr[@]}")
    JSON_D_STATE="[${JSON_D_STATE:1}]"
fi

# --- SUID/SGID ---
section "SUID/SGID бинарники в системных папках (модуль 12)"
suid_sgid_arr=()
# Ищем SUID (4000) и SGID (2000)
while read -r perm file; do
    type="SUID"
    [[ "$perm" == *g* || "$perm" == *2??? ]] && type="SGID"
    info "$type: $file"
    if [[ "$JSON" -eq 1 ]]; then
        suid_sgid_arr+=("{\"type\":\"$type\",\"path\":\"$file\"}")
    fi
done < <(find /usr/bin /usr/sbin /bin /sbin -perm /6000 -type f -printf "%m %p\n" 2>/dev/null || \
         find /usr/bin /usr/sbin /bin /sbin \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null | awk '{print "unknown", $0}')

if [[ "$JSON" -eq 1 && ${#suid_sgid_arr[@]} -gt 0 ]]; then
    JSON_SUID_SGID=$(printf ",%s" "${suid_sgid_arr[@]}")
    JSON_SUID_SGID="[${JSON_SUID_SGID:1}]"
fi

# --- Cron ---
section "Cron: system + user"
cron_arr=()
# Системный crontab
if [[ -f /etc/crontab ]]; then
    while read -r line; do
        if [[ "$JSON" -eq 0 ]]; then
            echo "    crontab: $line"
        else
            escaped=$(echo "$line" | sed 's/"/\\"/g')
            cron_arr+=("{\"source\":\"/etc/crontab\",\"line\":\"$escaped\"}")
        fi
    done < <(grep -vE '^\s*#|^\s*$' /etc/crontab || true)
fi

# Списки задач по директориям
for d in /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly; do
    if [[ -d "$d" ]]; then
        while read -r f; do
            if [[ "$JSON" -eq 0 ]]; then
                echo "    cron-dir: $f"
            else
                cron_arr+=("{\"source\":\"$d\",\"line\":\"$f\"}")
            fi
        done < <(find "$d" -type f 2>/dev/null || true)
    fi
done

# Пользовательский crontab
if command -v crontab &>/dev/null; then
    while read -r line; do
        if [[ "$JSON" -eq 0 ]]; then
            echo "    user-crontab: $line"
        else
            escaped=$(echo "$line" | sed 's/"/\\"/g')
            cron_arr+=("{\"source\":\"user-crontab\",\"line\":\"$escaped\"}")
        fi
    done < <(crontab -l 2>/dev/null | grep -vE '^\s*#|^\s*$' || true)
fi

if [[ "$JSON" -eq 1 && ${#cron_arr[@]} -gt 0 ]]; then
    JSON_CRON_JOBS=$(printf ",%s" "${cron_arr[@]}")
    JSON_CRON_JOBS="[${JSON_CRON_JOBS:1}]"
fi

# --- systemd failed ---
section "Сервисы systemd (модуль 02: UGKIS)"
systemd_failed_arr=()
if command -v systemctl &>/dev/null; then
    failed_units_count=$(systemctl --failed --no-pager 2>/dev/null | grep -c failed || true)
    if [[ "$failed_units_count" -gt 0 ]]; then
        while read -r unit load active sub desc; do
            # Пропускаем строки заголовков и футера
            [[ -z "$unit" || "$unit" == "UNIT" || "$unit" == "LOAD" || "$unit" == *failed* ]] && continue
            if [[ "$JSON" -eq 0 ]]; then
                echo "    FAILED: $unit ($desc)"
            else
                escaped_desc=$(echo "$desc" | sed 's/"/\\"/g')
                systemd_failed_arr+=("{\"unit\":\"$unit\",\"active\":\"$active\",\"sub\":\"$sub\",\"description\":\"$escaped_desc\"}")
            fi
        done < <(systemctl --failed --no-pager 2>/dev/null | awk '{print $1, $2, $3, $4, $5}' || true)
    else
        info "Failed units не обнаружены"
    fi
fi

if [[ "$JSON" -eq 1 && ${#systemd_failed_arr[@]} -gt 0 ]]; then
    JSON_SYSTEMD_FAILED=$(printf ",%s" "${systemd_failed_arr[@]}")
    JSON_SYSTEMD_FAILED="[${JSON_SYSTEMD_FAILED:1}]"
fi

section "Готово"

# --- Вывод JSON ---
if [[ "$JSON" -eq 1 ]]; then
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat <<EOF
{
  "timestamp": "$TIMESTAMP",
  "root_check": {
    "is_root": $IS_ROOT
  },
  "login_users": $JSON_LOGIN_USERS,
  "uid_zero_non_root": $JSON_UID_ZERO,
  "empty_passwords": $JSON_EMPTY_PASSWORDS,
  "sudo_rules": $JSON_SUDO_RULES,
  "zombies": $JSON_ZOMBIES,
  "top_cpu": $JSON_TOP_CPU,
  "d_state_processes": $JSON_D_STATE,
  "suid_sgid_files": $JSON_SUID_SGID,
  "cron_jobs": $JSON_CRON_JOBS,
  "failed_systemd": $JSON_SYSTEMD_FAILED
}
EOF
fi