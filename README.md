# Linux Security Learning Stack

**Веб-приложение** на [vibe](https://github.com/di-sukharev/vibe) (интерактивные модули + hygiene) + два набора CLI-инструментов: Bash Toolkit и Python Automation.

```
Кетов (мнемосхемы) → Bash Toolkit → Python Automation → Cyber Hygiene
     понимание           руки            масштаб           реальная жизнь
```

## Главное — веб-приложение

```bash
cd linux-brain-map-app
bun install
bun run dev:webapp
# → http://localhost:5173
```

Интерактивные модули, квизы, прогресс, toolkit, hygiene checklist.

## Проекты

| Папка | Назначение | Старт |
|-------|------------|-------|
| **[linux-brain-map-app/](linux-brain-map-app/)** | **Веб-UI (vibe + React)** | [README](linux-brain-map-app/README.md) |
| [bash-security-toolkit/](bash-security-toolkit/) | CLI-инструменты Blue Team | [README.md](bash-security-toolkit/README.md) |
| [python-security/](python-security/) | Автоматизация и мониторинг | [README.md](python-security/README.md) |

## Маршрут на 4 недели

| Неделя | Теория (Кетов) | Практика |
|--------|----------------|----------|
| 1 | Модули 01–04 | `user_audit.sh` |
| 2 | Модули 05–08 | `log_analyzer.sh` |
| 3 | Модули 09–12 | `hash_checker.sh`, `port_scanner.sh` |
| 4 | Повтор + связки | Python-скрипты + home audit |

## Формула одного модуля

```
Мнемосхема (5 мин) → 1 команда (5 мин) → 1 bash-скрипт (30 мин) → 1 пункт hygiene
```

## Быстрый старт

```bash
cd bash-security-toolkit
chmod +x *.sh
./user_audit.sh
./log_analyzer.sh /var/log/auth.log
./hash_checker.sh /etc
./port_scanner.sh 127.0.0.1
```