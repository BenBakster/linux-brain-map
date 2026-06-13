# AUDIT: вкладка «Практика» и команды к bash/python toolkit

**Для:** Claude Code (аудит + исправление)  
**Репозиторий:** [BenBakster/linux-brain-map](https://github.com/BenBakster/linux-brain-map)  
**Приоритет:** средний (UX + переносимость), не блокирует обучение  
**Статус:** открыт

---

## Проблема

На вкладке **Практика** в webapp пользователю копируется команда с **жёстко прошитым абсолютным путём** одного разработчика:

```bash
cd "bash-security-toolkit" && ./user_audit.sh
```

Это выглядит «стремно» и ломается у любого, кто:

- клонировал репо в другое место;
- открыл только GitHub Pages (там вообще нет терминала);
- работает на другой ОС / другом пользователе.

Та же логика дублируется на странице **Toolkit**.

---

## Где искать (обязательно прочитать)

| Файл | Что не так |
|------|------------|
| `linux-brain-map-app/webapp/src/pages.tsx` | Константа `TOOLKIT_DIR` с `~/...`; сборка `runCmd` и блоки `CopyButton` |
| `linux-brain-map-app/webapp/src/data/toolkit.ts` | Относительные пути `../bash-security-toolkit` — ок для структуры репо, но **не используются** в UI копирования |
| `linux-brain-map-app/webapp/src/data/modules.ts` | Поля `bashScript`, `pythonScript`, `commands` — привязка модуль → скрипт |
| `bash-security-toolkit/README.md` | Эталон: команды без `cd` в чужой home |
| `python-security/README.md` | То же для Python |

---

## Ожидаемое поведение (acceptance criteria)

После исправления:

1. **Никаких абсолютных путей** с `user`, `Документи`, `_Проекты` в UI и в копируемых строках.
2. Копируемая команда **понятна новичку** и работает после стандартного клона:

   ```bash
   git clone https://github.com/BenBakster/linux-brain-map.git
   cd linux-brain-map/bash-security-toolkit
   chmod +x *.sh
   ./user_audit.sh
   ```

3. На вкладке **Практика** — короткая подсказка: «сначала перейди в папку toolkit в своём клоне репозитория».
4. Команды **одного стиля** для bash и python (не смешивать `./script.sh` и длинный `cd /home/...`).
5. GitHub Pages: явно указать, что скрипты запускаются **локально в терминале**, не в браузере (1–2 предложения в `CardDescription`).
6. По возможности — **один источник правды** для путей/команд (`toolkit.ts` → UI), без дублирования в `pages.tsx`.
7. `bun run build:pages` проходит; задеплоить на `gh-pages` по желанию (см. README).

---

## Рекомендуемое направление решения

Выбери один подход (или комбинируй), задокументируй в PR/commit:

### Вариант A — «относительно корня репо» (предпочтительно)

В `toolkit.ts` добавить хелперы:

```ts
export const REPO_HINT = 'cd linux-brain-map   # или твоя папка после git clone'

export function bashRun(script: string): string {
  return `cd bash-security-toolkit && chmod +x ${script} 2>/dev/null; ./${script}`
}

export function pythonRun(script: string, args = ''): string {
  return `cd python-security && python3 ${script}${args ? ' ' + args : ''}`
}
```

UI показывает **два блока**: (1) один раз «как добраться до репо», (2) сама команда без личного пути.

### Вариант B — wrapper в корне репо

Добавить `run-toolkit.sh` в корень:

```bash
#!/usr/bin/env bash
exec "$(dirname "$0")/bash-security-toolkit/$1" "${@:2}"
```

Тогда в UI: `./run-toolkit.sh user_audit.sh` из корня клона.

### Вариант C — переменная окружения (для продвинутых)

```bash
export LINUX_BRAIN_MAP_ROOT=~/projects/linux-brain-map
cd "$LINUX_BRAIN_MAP_ROOT/bash-security-toolkit" && ./user_audit.sh
```

В UI — опциональный collapsible «для своего пути», по умолчанию вариант A.

**Не делать:** оставлять `TOOLKIT_DIR` с home-директорией; тянуть путь из `localStorage` без объяснения.

---

## Примеры: плохо → хорошо

| Сейчас (плохо) | Нужно (хорошо) |
|----------------|----------------|
| `cd "bash-security-toolkit" && ./user_audit.sh` | `cd bash-security-toolkit && ./user_audit.sh` |
| `python3 ../python-security/log_anomaly.py` (без контекста) | `cd python-security && python3 log_anomaly.py /var/log/auth.log` |
| Длинный путь в каждом модуле | Один раз инструкция clone + короткая команда в модуле |

---

## Связанные модули (для регрессии)

Проверить вкладку **Практика** хотя бы в модулях:

| Модуль | bash | python |
|--------|------|--------|
| 01 architecture | `user_audit.sh` | — |
| 04 processes | `user_audit.sh` | `log_anomaly.py` |
| 06 memory | `log_analyzer.sh` | `log_anomaly.py` |
| 09 filesystems | `hash_checker.sh` | — |
| 11 networking | `port_scanner.sh` | `port_scan.py` |
| 12 security | `user_audit.sh` | `cve_monitor.py` |

Страница **/toolkit** — все 4 bash + 3 python скрипта.

---

## Чеклист для Claude Code

- [ ] Прочитать `pages.tsx`, `toolkit.ts`, `modules.ts`
- [ ] Удалить `TOOLKIT_DIR` с абсолютным путём
- [ ] Централизовать генерацию команд в `toolkit.ts` (или `lib/toolkit-commands.ts`)
- [ ] Обновить тексты `CardDescription` на вкладке Практика и странице Toolkit
- [ ] Убедиться, что `grep -r user` по репо не находит путей в webapp
- [ ] `cd linux-brain-map-app && bun run build:pages` — успех
- [ ] Кратко описать изменения в `linux-brain-map-app/README.md` (раздел «Практика»)
- [ ] Commit + push в `main`; при необходимости обновить `gh-pages`

---

## Контекст проекта (кратко)

- **Webapp:** `linux-brain-map-app/webapp` (vibe + React), деплой: https://benbakster.github.io/linux-brain-map/
- **Скрипты:** `bash-security-toolkit/`, `python-security/` — соседи webapp в монорепо
- **Тема UI:** rust/stoner psychedelic — не трогать в этом аудите

---

## Промпт для вставки в Claude Code

```
Прочитай AUDIT-practice-toolkit.md в корне репозитория linux-brain-map.
Выполни аудит и исправь вкладку «Практика» и страницу Toolkit: убери абсолютные
пути, сделай переносимые команды для любого git clone. Следуй acceptance criteria
и чеклисту в документе. После правок — build:pages и commit.
```