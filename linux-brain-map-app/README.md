# Linux Brain Map

Статическое SPA для изучения Linux по Кетову и основ IBM Cybersecurity:
мнемосхемы, таблицы, квизы, bash/python toolkit, cyber hygiene, Kill Chain и ATT&CK.

Деплой: **GitHub Pages** → https://benbakster.github.io/linux-brain-map/

Стек: React + Vite + TanStack Router + shadcn/ui + Tailwind CSS v4.

## Быстрый старт

```bash
cd linux-brain-map-app
bun install
bun run dev
```

Открой http://localhost:5173

## Структура

```
linux-brain-map-app/
└── webapp/                  ← единственное приложение
    ├── src/data/            ← контент (modules.ts, hygiene.ts, toolkit.ts)
    ├── src/pages.tsx        ← все страницы (Dashboard, Module, Toolkit, Hygiene)
    └── src/lib/progress.ts  ← localStorage прогресс
```

## Страницы

| Раздел | URL | Содержимое |
|--------|-----|------------|
| Модули | `/` | 12 карточек Кетова |
| Модуль | `/module/architecture` | схема → таблица → квиз → практика |
| Toolkit | `/toolkit` | bash + python скрипты с кнопкой копирования |
| Hygiene | `/hygiene` | чеклист с прогрессом |
| IBM Cyber | `/ibm` | CIA, IAM, incident response, криптография, форензика, Kill Chain и ATT&CK |
| Повторение | `/review` | прямые/reverse-карточки с локальным интервальным планировщиком |
| Brain Map | `/map` | интерактивные связи Linux, IBM, Kill Chain и ATT&CK |
| Глоссарий | `/glossary` | 82 термина ядра по категориям, поиск, бэклинки в модули |
| Хронология | `/timeline` | история Unix → Linux: 50 событий по эпохам с кросс-ссылками |

Прогресс сохраняется в `localStorage` браузера.

## Практика (скрипты)

Скрипты запускаются локально после `git clone`. Клон содержит `bash-security-toolkit/` и `python-security/` рядом с `linux-brain-map-app/`.

```bash
# bash
cd bash-security-toolkit && ./user_audit.sh

# python
cd python-security && python3 cve_monitor.py openssh --days 30
```

## Сборка и деплой

```bash
# Локальный preview
bun run build:pages
bun run --cwd webapp preview

# CI деплой в GitHub Pages — автоматически при push в main
# .github/workflows/deploy-pages.yml
```
