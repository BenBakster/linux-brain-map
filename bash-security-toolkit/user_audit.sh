#!/usr/bin/env bash
# user_audit.sh — аудит пользователей, процессов, автозапуска
# Модули: 01-architecture, 02-boot, 04-processes, 05-scheduler, 07-sync, 12-security

set -euo pipefail

JSON=0
[[ "${1:-}" == "--json" ]] && JSON=1

section() {
    [[ "$JSON" -eq 1 ]] && return
    echo
    echo "=== $1 ==="
}

warn() {
    if [[ "$JSON" -eq 1 ]]; then
        echo "WARN|$1"
    else
        echo "[!] $1"
    fi
}

info() {
    if [[ "$JSON" -eq 1 ]]; then
        echo "INFO|$1"
    else
        echo "    $1"
    fi
}

# --- Пользователи с shell ---
section "Пользователи с login shell"
while IFS=: read -r user _ uid gid _ home shell; do
    if [[ "$shell" == *sh ]] && [[ "$uid" -ge 1000 || "$user" == "root" ]]; then
        info "$user (uid=$uid) shell=$shell home=$home"
    fi
done < /etc/passwd

# --- UID 0 кроме root ---
section "UID 0 (кроме root)"
awk -F: '$3==0 && $1!="root" {print "[!] СУПЕРПОЛЬЗОВАТЕЛЬ:", $1}' /etc/passwd || true

# --- Пустые пароли ---
section "Аккаунты без пароля"
if [[ -r /etc/shadow ]]; then
    while IFS=: read -r user pass _; do
        [[ -z "$pass" ]] && warn "Пустой пароль: $user"
    done < /etc/shadow
else
    warn "Нет доступа к /etc/shadow (нужен root)"
fi

# --- sudo ---
section "Правила sudo"
if [[ -r /etc/sudoers ]]; then
    grep -vE '^\s*#|^\s*$' /etc/sudoers 2>/dev/null | head -20 || true
else
    warn "Нет доступа к /etc/sudoers"
fi
[[ -d /etc/sudoers.d ]] && ls -la /etc/sudoers.d/ 2>/dev/null | tail -n +2 || true

# --- Зомби ---
section "Zombie-процессы (модуль 04: FET)"
zombies=$(ps -eo stat | grep -c Z || true)
if [[ "$zombies" -gt 0 ]]; then
    warn "Найдено zombie: $zombies"
    ps -eo pid,ppid,stat,cmd | awk '$3 ~ /Z/ {print}'
else
    info "Zombie не обнаружены"
fi

# --- Топ CPU ---
section "Топ-10 по CPU (модуль 05: CFS)"
ps aux --sort=-%cpu 2>/dev/null | head -11 || ps -eo pid,pcpu,comm --sort=-pcpu | head -11

# --- Процессы в D state ---
section "Uninterruptible sleep (D) — модуль 07"
d_count=$(ps -eo stat | grep -c '^D' 2>/dev/null || echo 0)
if [[ "$d_count" -gt 0 ]]; then
    warn "Процессы в состоянии D: $d_count"
    ps -eo pid,stat,cmd | awk '$2 ~ /D/'
else
    info "Процессов в D нет"
fi

# --- SUID/SGID ---
section "SUID бинарники в /usr (модуль 12)"
find /usr/bin /usr/sbin /bin /sbin -perm -4000 -type f 2>/dev/null | while read -r f; do
    info "SUID: $f"
done

# --- Cron ---
section "Cron: system + user"
[[ -f /etc/crontab ]] && cat /etc/crontab
for d in /etc/cron.d /etc/cron.daily /etc/cron.hourly; do
    [[ -d "$d" ]] && find "$d" -type f 2>/dev/null | while read -r f; do info "$f"; done
done
crontab -l 2>/dev/null || info "Нет user crontab"

# --- systemd failed ---
section "Сервисы systemd (модуль 02: UGKIS)"
if command -v systemctl &>/dev/null; then
    failed=$(systemctl --failed --no-pager 2>/dev/null | grep -c failed || echo 0)
    if [[ "$failed" -gt 1 ]]; then
        systemctl --failed --no-pager 2>/dev/null || true
    else
        info "Failed units не обнаружены"
    fi
fi

section "Готово"