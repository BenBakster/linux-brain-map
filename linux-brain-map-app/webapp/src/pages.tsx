import { Link, Outlet, useParams } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { CopyButton } from '@/components/CopyButton'
import { FlowDiagram } from '@/components/FlowDiagram'
import { ProgressBar } from '@/components/ProgressBar'
import { QuizPanel } from '@/components/QuizPanel'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { HYGIENE_ITEMS } from '@/data/hygiene'
import { MODULES, getModule } from '@/data/modules'
import { PYTHON_SCRIPTS, TOOLKIT_SCRIPTS } from '@/data/toolkit'
import {
  getCompletionPercent,
  getHygieneChecked,
  getHygienePercent,
  isModuleComplete,
  markModuleComplete,
  toggleHygieneItem,
} from '@/lib/progress'
import { cn } from '@/lib/utils'

const navLinkClass = cn(
  buttonVariants({ variant: 'ghost', size: 'sm' }),
  'text-muted-foreground data-[status=active]:bg-accent/25 data-[status=active]:text-[oklch(0.92_0.06_80)] data-[status=active]:shadow-[0_0_10px_oklch(0.72_0.17_48/0.2)]',
)

const TOOLKIT_DIR =
  'bash-security-toolkit'

export function RootLayout() {
  const moduleProgress = getCompletionPercent(MODULES.length)
  const hygieneProgress = getHygienePercent(HYGIENE_ITEMS.length)

  return (
    <div className="min-h-svh text-foreground">
      <header className="psy-header sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="psy-logo flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black text-primary-foreground">
              L
            </span>
            <Typography variant="h6" className="psy-title hidden font-bold sm:block">
              Linux Brain Map
            </Typography>
          </Link>

          <nav className="ml-auto flex flex-wrap items-center gap-1" aria-label="Primary">
            <Link to="/" className={navLinkClass}>
              Модули
            </Link>
            <Link to="/toolkit" className={navLinkClass}>
              Toolkit
            </Link>
            <Link to="/hygiene" className={navLinkClass}>
              Hygiene
            </Link>
          </nav>

          <div className="hidden w-48 lg:block">
            <ProgressBar value={moduleProgress} label="Кетов" />
          </div>
          <Badge variant="outline" className="lg:hidden">
            {moduleProgress}% · {hygieneProgress}% H
          </Badge>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

export function DashboardPage() {
  const progress = getCompletionPercent(MODULES.length)

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 grid gap-4">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          По Кетову · мнемосхемы вместо чтения
        </Badge>
        <Typography variant="h1" className="psy-title max-w-3xl text-3xl font-bold sm:text-4xl">
          12 модулей Linux — схемы, таблицы, квизы, практика
        </Typography>
        <Typography tone="muted" className="max-w-2xl">
          Каждый модуль: мнемоника → схема потока → таблица команд → квиз → bash-скрипт.
          Прогресс сохраняется локально в браузере.
        </Typography>
        <ProgressBar value={progress} label={`Пройдено модулей: ${MODULES.filter((m) => isModuleComplete(m.id)).length}/${MODULES.length}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => {
          const done = isModuleComplete(mod.id)
          return (
            <Link key={mod.id} to="/module/$moduleId" params={{ moduleId: mod.id }}>
              <Card
                className={cn(
                  'psy-card-hover h-full border-border/80 bg-card/90 backdrop-blur-sm',
                  done && 'psy-done',
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="border border-primary/40 bg-primary/20 font-mono text-[oklch(0.92_0.06_80)]"
                    >
                      {String(mod.number).padStart(2, '0')}
                    </Badge>
                    {done && (
                      <Badge className="border-0 bg-[oklch(0.58_0.14_145)] text-white shadow-[0_0_10px_oklch(0.58_0.14_145/0.5)]">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-foreground">{mod.title}</CardTitle>
                  <CardDescription>
                    <span className="psy-mnemonic font-mono text-lg font-bold">{mod.mnemonic}</span>
                    {' — '}
                    {mod.mnemonicExpansion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{mod.summary}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function ModulePage() {
  const { moduleId } = useParams({ from: '/module/$moduleId' })
  const mod = getModule(moduleId)

  if (!mod) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Typography variant="h2">Модуль не найден</Typography>
        <Button asChild className="mt-4">
          <Link to="/">На главную</Link>
        </Button>
      </section>
    )
  }

  const prev = MODULES.find((m) => m.number === mod.number - 1)
  const next = MODULES.find((m) => m.number === mod.number + 1)
  const runCmd = mod.bashScript
    ? `cd "${TOOLKIT_DIR}" && ./${mod.bashScript}`
    : mod.commands[0]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge className="psy-mnemonic border border-accent/40 bg-accent/15 font-mono text-lg">
          {mod.mnemonic}
        </Badge>
        <Typography variant="h1" className="psy-title text-2xl font-bold sm:text-3xl">
          {mod.number}. {mod.title}
        </Typography>
      </div>

      <Card className="psy-highlight-card mb-6 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="font-mono text-sm tracking-wide text-[oklch(0.9_0.08_80)]">
            {mod.mnemonicExpansion}
          </p>
          <p className="mt-2 text-muted-foreground">{mod.summary}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="scheme" className="grid gap-4">
        <TabsList className="flex h-auto flex-wrap gap-1 border border-border/60 bg-muted/50 p-1">
          <TabsTrigger value="scheme">Схема</TabsTrigger>
          <TabsTrigger value="table">Таблица</TabsTrigger>
          <TabsTrigger value="decisions">Решения</TabsTrigger>
          <TabsTrigger value="quiz">Квиз</TabsTrigger>
          <TabsTrigger value="practice">Практика</TabsTrigger>
        </TabsList>

        <TabsContent value="scheme">
          <Card>
            <CardHeader>
              <CardTitle>Поток — запомни стрелки</CardTitle>
            </CardHeader>
            <CardContent>
              <FlowDiagram steps={mod.flow} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Сущность → где смотреть → аномалия</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сущность</TableHead>
                    <TableHead>Команда / файл</TableHead>
                    <TableHead>Сигнал проблемы</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mod.table.map((row) => (
                    <TableRow key={row.entity}>
                      <TableCell className="font-medium">{row.entity}</TableCell>
                      <TableCell className="font-mono text-sm">{row.where}</TableCell>
                      <TableCell className="text-muted-foreground">{row.signal}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Дерево решений</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {mod.decisions.map((d) => (
                <div
                  key={d.condition}
                  className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="font-medium text-destructive">Если: {d.condition}</span>
                  <span className="hidden text-muted-foreground sm:inline">→</span>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{d.action}</code>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <QuizPanel moduleId={mod.id} questions={mod.quiz} />
        </TabsContent>

        <TabsContent value="practice">
          <Card>
            <CardHeader>
              <CardTitle>Команды и скрипты</CardTitle>
              <CardDescription>
                Скопируй в терминал. Скрипты лежат в bash-security-toolkit/
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {mod.commands.map((cmd) => (
                <div key={cmd} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3">
                  <code className="flex-1 font-mono text-sm">{cmd}</code>
                  <CopyButton text={cmd} />
                </div>
              ))}
              {mod.bashScript && (
                <div className="psy-highlight-card flex flex-wrap items-center gap-2 rounded-lg p-3">
                  <code className="flex-1 font-mono text-sm">{runCmd}</code>
                  <CopyButton text={runCmd} label="Копировать скрипт" />
                </div>
              )}
              {mod.pythonScript && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                  <code className="flex-1 font-mono text-sm">
                    python3 ../python-security/{mod.pythonScript}
                  </code>
                  <CopyButton text={`python3 ../python-security/${mod.pythonScript}`} />
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={() => markModuleComplete(mod.id)}
              >
                Отметить модуль пройденным
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-between gap-4">
        {prev ? (
          <Button asChild variant="outline">
            <Link to="/module/$moduleId" params={{ moduleId: prev.id }}>
              ← {prev.mnemonic}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button asChild>
            <Link to="/module/$moduleId" params={{ moduleId: next.id }}>
              {next.mnemonic} →
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/hygiene">Hygiene →</Link>
          </Button>
        )}
      </div>
    </section>
  )
}

export function ToolkitPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <Typography variant="h1" className="psy-title mb-2 text-3xl font-bold">
        Bash & Python Toolkit
      </Typography>
      <Typography tone="muted" className="mb-8 max-w-2xl">
        Скрипты из IT_Cybersecurity/bash-security-toolkit и python-security. Запускай в терминале.
      </Typography>

      <div className="mb-10 grid gap-4">
        <Typography variant="h3">Bash</Typography>
        {TOOLKIT_SCRIPTS.map((script) => (
          <Card key={script.id}>
            <CardHeader>
              <CardTitle>{script.name}</CardTitle>
              <CardDescription>{script.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex flex-wrap gap-1">
                {script.modules.map((n) => (
                  <Badge key={n} variant="outline">
                    #{n}
                  </Badge>
                ))}
              </div>
              {script.usage.map((u) => (
                <div key={u} className="flex flex-wrap items-center gap-2 rounded bg-muted p-2">
                  <code className="flex-1 font-mono text-sm">
                    cd "{TOOLKIT_DIR}" && {u}
                  </code>
                  <CopyButton text={`cd "${TOOLKIT_DIR}" && ${u}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        <Typography variant="h3">Python</Typography>
        {PYTHON_SCRIPTS.map((script) => (
          <Card key={script.id}>
            <CardHeader>
              <CardTitle>{script.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {script.usage.map((u) => (
                <div key={u} className="flex flex-wrap items-center gap-2 rounded bg-muted p-2">
                  <code className="flex-1 font-mono text-sm">{u}</code>
                  <CopyButton text={u} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function HygienePage() {
  const [checked, setChecked] = useState(() => getHygieneChecked())
  const percent = getHygienePercent(HYGIENE_ITEMS.length)

  const sections = useMemo(() => {
    const map = new Map<string, typeof HYGIENE_ITEMS>()
    for (const item of HYGIENE_ITEMS) {
      const list = map.get(item.section) ?? []
      list.push(item)
      map.set(item.section, list)
    }
    return [...map.entries()]
  }, [])

  function handleToggle(id: string) {
    setChecked(toggleHygieneItem(id))
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <Typography variant="h1" className="psy-title mb-2 text-3xl font-bold">
        Cyber Hygiene
      </Typography>
      <Typography tone="muted" className="mb-6">
        Личная и домашняя безопасность. Прогресс сохраняется локально.
      </Typography>
      <ProgressBar value={percent} label={`Выполнено: ${checked.size}/${HYGIENE_ITEMS.length}`} />

      <div className="mt-8 grid gap-6">
        {sections.map(([section, items]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-lg">{section}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={checked.has(item.id)}
                    onCheckedChange={() => handleToggle(item.id)}
                  />
                  <span className={cn('text-sm', checked.has(item.id) && 'text-muted-foreground line-through')}>
                    {item.text}
                    {item.moduleRef && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        модуль {item.moduleRef}
                      </Badge>
                    )}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}