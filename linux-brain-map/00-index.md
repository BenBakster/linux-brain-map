# Linux Brain Map — индекс (по Кетову)

Замена хаотичного чтения книги на схемы, таблицы и деревья решений.

## 12 модулей

| # | Модуль | Мнемоника | Bash | Python | Hygiene |
|---|--------|-----------|------|--------|---------|
| 01 | [Архитектура](01-architecture/README.md) | **KUPU** | `user_audit.sh` | — | checklist §1 |
| 02 | [Загрузка](02-boot/README.md) | **UGKIS** | `user_audit.sh` | — | checklist §2 |
| 03 | [Системные вызовы](03-syscalls/README.md) | **UKU** | `user_audit.sh` | `log_anomaly.py` | — |
| 04 | [Процессы](04-processes/README.md) | **FET** | `user_audit.sh` | `log_anomaly.py` | checklist §3 |
| 05 | [Планировщик](05-scheduler/README.md) | **EEVDF** | `user_audit.sh` | `log_anomaly.py` | — |
| 06 | [Память](06-memory/README.md) | **VPS** | `log_analyzer.sh` | `log_anomaly.py` | checklist §4 |
| 07 | [Синхронизация](07-sync/README.md) | **MSFR** | `user_audit.sh` | — | — |
| 08 | [IPC](08-ipc/README.md) | **PFMS** | `log_analyzer.sh` | — | — |
| 09 | [Файловые системы](09-filesystems/README.md) | **VID** | `hash_checker.sh` | — | checklist §5 |
| 10 | [Блочный I/O](10-block-io/README.md) | **FBD** | `hash_checker.sh` | — | — |
| 11 | [Сеть](11-networking/README.md) | **STN** | `port_scanner.sh` | `port_scan.py` | home-network-audit |
| 12 | [Безопасность](12-security/README.md) | **CAPNS** | все скрипты | `cve_monitor.py` | ncsc-10-steps |

## Мнемоники одной строкой

- **KUPU** — Kernel, Userspace, Processes, Users
- **UGKIS** — UEFI → GRUB → Kernel → initramfs → systemd
- **UKU** — User → Kernel → User (syscall)
- **FET** — Fork, Exec, Terminate
- **VPS** — Virtual memory, Paging, Swap
- **VID** — VFS, Inode, Dentry
- **CAPNS** — Capabilities, AppArmor, PAM, Namespaces, Seccomp

## Как учить модуль

1. Открыть README модуля — прочитать мнемонику и схему (5 мин)
2. Выполнить команды из таблицы «что смотреть»
3. Запустить привязанный bash-скрипт
4. Отметить пункт в cyber-hygiene