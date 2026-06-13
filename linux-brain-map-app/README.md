# Linux Brain Map

Интерактивное веб-приложение для изучения Linux по Кетову: мнемосхемы, таблицы, квизы, bash/python toolkit, cyber hygiene.

Собрано на [vibe](https://github.com/di-sukharev/vibe) (React + Vite + TanStack Router + shadcn).

## Быстрый старт

```bash
cd linux-brain-map-app
bun install
bun run dev:webapp
```

Открой http://localhost:5173

## Что внутри

| Раздел | URL | Содержимое |
|--------|-----|------------|
| Модули | `/` | 12 карточек Кетова |
| Модуль | `/module/architecture` | схема, таблица, квиз, практика |
| Toolkit | `/toolkit` | bash + python скрипты с копированием |
| Hygiene | `/hygiene` | чеклист с прогрессом |

Прогресс хранится в `localStorage` браузера.

## Связанные папки

```
IT_Cybersecurity/
├── linux-brain-map-app/     ← это приложение (vibe webapp)
├── bash-security-toolkit/   ← скрипты для вкладки «Практика»
├── python-security/
├── cyber-hygiene/           ← исходные чеклисты (данные в webapp/src/data/)
└── linux-brain-map/         ← markdown-версия (архив)
```

## Сборка

```bash
bun run build:webapp
bun run --cwd webapp preview
```