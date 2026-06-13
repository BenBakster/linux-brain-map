# Bash Security Toolkit

CLI-инструменты Blue Team, привязанные к модулям [linux-brain-map](../linux-brain-map/00-index.md).

| Скрипт | Модули Кетова | Что проверяет |
|--------|---------------|---------------|
| `user_audit.sh` | 01, 02, 04, 05, 07, 12 | пользователи, sudo, cron, SUID, зомби, CPU |
| `log_analyzer.sh` | 06, 08, 11, 12 | auth failures, OOM, sudo, SSH |
| `hash_checker.sh` | 09, 10, 12 | SHA-256 критичных файлов |
| `port_scanner.sh` | 11, 12 | открытые порты, сравнение с ss |

## Использование

```bash
chmod +x *.sh

./user_audit.sh
./user_audit.sh --json          # машиночитаемый вывод

./log_analyzer.sh /var/log/auth.log
./log_analyzer.sh /var/log/syslog --since "1 hour ago"

./hash_checker.sh /etc
./hash_checker.sh --baseline /etc > baseline.sha256
./hash_checker.sh --check baseline.sha256

./port_scanner.sh 127.0.0.1
./port_scanner.sh 192.168.1.1 --top-ports 100
```

## Зависимости

- bash 4+
- стандартные утилиты: `awk`, `grep`, `find`, `ss`, `sha256sum`
- опционально: `nmap` (для port_scanner), `journalctl` (для log_analyzer)