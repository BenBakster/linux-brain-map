import { Link, Outlet, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { CopyButton } from '@/components/CopyButton'
import { DiagramView, decisionsToDiagram } from '@/components/DiagramView'
import { linkifyProse } from '@/components/GlossaryLinker'
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
import { BRAIN_EDGES, BRAIN_NODES } from '@/data/brain-map'
import { COMPARE_TABLES } from '@/data/compare'
import { GLOSSARY, GLOSSARY_CATEGORIES, getGlossaryByCategory, getTerm } from '@/data/glossary'
import {
  TIMELINE,
  getEvent,
  getTimelineByEra,
  type TimelineEventKind,
} from '@/data/timeline'
import { HYGIENE_ITEMS } from '@/data/hygiene'
import { ATTACK_TACTICS, IBM_TOPICS, KILL_CHAIN } from '@/data/ibm'
import { MODULE_DIAGRAMS } from '@/data/module-diagrams'
import { MODULES, getModule } from '@/data/modules'
import { REVIEW_CARDS, type ReviewTrack } from '@/data/review'
import { PYTHON_SCRIPTS, TOOLKIT_SCRIPTS, bashCmd, pythonCmd } from '@/data/toolkit'
import {
  markModuleComplete,
  toggleHygieneItem,
  useCompletionPercent,
  useHygiene,
  useHygienePercent,
  useIbmCompletionPercent,
  useProgress,
} from '@/lib/progress'
import {
  getDueCards,
  getReviewState,
  getReviewStats,
  rateCard,
  type ReviewRating,
} from '@/lib/review'
import { cn } from '@/lib/utils'

const navLinkClass = cn(
  buttonVariants({ variant: 'ghost', size: 'sm' }),
  'text-muted-foreground data-[status=active]:bg-accent/25 data-[status=active]:text-[oklch(0.92_0.06_80)] data-[status=active]:shadow-[0_0_10px_oklch(0.72_0.17_48/0.2)]',
)

export function RootLayout() {
  const moduleProgress = useCompletionPercent(MODULES.length)
  const ibmProgress = useIbmCompletionPercent(IBM_TOPICS.length)
  const hygieneProgress = useHygienePercent(HYGIENE_ITEMS.length)

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
            <Link to="/ibm" className={navLinkClass}>
              IBM Cyber
            </Link>
            <Link to="/review" className={navLinkClass}>
              Повторение
            </Link>
            <Link to="/map" className={navLinkClass}>
              Brain Map
            </Link>
            <Link to="/glossary" className={navLinkClass}>
              Глоссарий
            </Link>
            <Link to="/timeline" className={navLinkClass}>
              Хронология
            </Link>
            <Link to="/compare" className={navLinkClass}>
              Сравнения
            </Link>
          </nav>

          <div className="hidden w-40 xl:block">
            <ProgressBar value={moduleProgress} label="Кетов" />
          </div>
          <div className="hidden w-40 xl:block">
            <ProgressBar value={ibmProgress} label="IBM" />
          </div>
          <Badge variant="outline" className="lg:hidden">
            {moduleProgress}% L · {ibmProgress}% IBM · {hygieneProgress}% H
          </Badge>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

export function DashboardPage() {
  const { completedModules } = useProgress()
  const progress = useCompletionPercent(MODULES.length)

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
        <ProgressBar value={progress} label={`Пройдено модулей: ${MODULES.filter((m) => completedModules.includes(m.id)).length}/${MODULES.length}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => {
          const done = completedModules.includes(mod.id)
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
    ? bashCmd(`./${mod.bashScript}`)
    : mod.commands[0]
  const explainerSeen = new Set<string>()
  const diagram = MODULE_DIAGRAMS[mod.number]

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
          {mod.epigraph && (
            <figure className="mb-4 border-l-2 border-accent/40 pl-3">
              <blockquote className="text-sm italic text-muted-foreground">
                «{mod.epigraph.text}»
              </blockquote>
              <figcaption className="mt-1 text-xs text-muted-foreground/80">
                — {mod.epigraph.author}
              </figcaption>
            </figure>
          )}
          <p className="font-mono text-sm tracking-wide text-[oklch(0.9_0.08_80)]">
            {mod.mnemonicExpansion}
          </p>
          <p className="mt-2 text-muted-foreground">{mod.summary}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue={mod.explainer ? 'explainer' : 'scheme'} className="grid gap-4">
        <TabsList className="flex h-auto flex-wrap gap-1 border border-border/60 bg-muted/50 p-1">
          {mod.explainer && <TabsTrigger value="explainer">Разбор</TabsTrigger>}
          <TabsTrigger value="scheme">Схема</TabsTrigger>
          <TabsTrigger value="table">Таблица</TabsTrigger>
          <TabsTrigger value="decisions">Решения</TabsTrigger>
          <TabsTrigger value="quiz">Квиз</TabsTrigger>
          <TabsTrigger value="practice">Практика</TabsTrigger>
        </TabsList>

        {mod.explainer && (
          <TabsContent value="explainer">
            <Card>
              <CardHeader>
                <CardTitle>Разбор — почему это так работает</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {mod.explainer.map((para) => (
                  <Typography key={para.slice(0, 40)} tone="muted" className="leading-relaxed">
                    {linkifyProse(para, explainerSeen)}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="scheme">
          <Card>
            <CardHeader>
              <CardTitle>Схема механизма</CardTitle>
              <CardDescription>
                Ветвления, петли и слои — как это работает на самом деле, а не одной линией.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagram ? (
                <DiagramView diagram={diagram} />
              ) : (
                <p className="text-sm text-muted-foreground">Схема пока не задана.</p>
              )}
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
              <CardDescription>Признак → команда диагностики.</CardDescription>
            </CardHeader>
            <CardContent>
              <DiagramView diagram={decisionsToDiagram(mod.decisions)} />
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
                Скрипты запускаются локально в терминале после git clone. В браузере терминала нет.
                Перейди в папку репозитория: <code>cd bash-security-toolkit</code> или <code>cd python-security</code>.
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
                    {pythonCmd(mod.pythonScript)}
                  </code>
                  <CopyButton text={pythonCmd(mod.pythonScript)} />
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
        Скрипты запускаются локально в терминале после <code>git clone</code>. В браузере терминала нет.
        Скопируй команду, вставь в терминал внутри клона репозитория.
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
                  <code className="flex-1 font-mono text-sm">{bashCmd(u)}</code>
                  <CopyButton text={bashCmd(u)} />
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
                  <code className="flex-1 font-mono text-sm">{pythonCmd(u)}</code>
                  <CopyButton text={pythonCmd(u)} />
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
  const checked = useHygiene()
  const percent = useHygienePercent(HYGIENE_ITEMS.length)

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
    toggleHygieneItem(id)
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

export function IbmPage() {
  const asset = (path: string) => `${import.meta.env.BASE_URL}ibm/${path}`
  const ibmProgress = useIbmCompletionPercent(IBM_TOPICS.length)
  const completedTopics = useProgress().completedIbmTopics.length

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 grid gap-4">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          IBM Cybersecurity · материалы из локального архива
        </Badge>
        <Typography variant="h1" className="psy-title max-w-4xl text-3xl font-bold sm:text-4xl">
          Основы ИБ: от CIA и доступа до форензики и цепочки атаки
        </Typography>
        <Typography tone="muted" className="max-w-3xl">
          Содержание извлечено из скриншотов курса и переработано в атомарные
          конспекты. Всё запечено в приложение: без LLM, сетевых запросов и ключей
          в рантайме.
        </Typography>
        <div className="max-w-xl">
          <ProgressBar
            value={ibmProgress}
            label={`Пройдено тем: ${completedTopics}/${IBM_TOPICS.length}`}
          />
        </div>
      </div>

      <Tabs defaultValue="topics" className="grid gap-5">
        <TabsList className="flex h-auto flex-wrap gap-1 border border-border/60 bg-muted/50 p-1">
          <TabsTrigger value="topics">Темы</TabsTrigger>
          <TabsTrigger value="kill-chain">Kill Chain</TabsTrigger>
          <TabsTrigger value="attack">ATT&amp;CK</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="grid gap-5">
          {IBM_TOPICS.map((topic) => (
            <Card key={topic.id} className="border-border/80 bg-card/90">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">
                    {String(topic.number).padStart(2, '0')}
                  </Badge>
                  <Badge variant="outline" className="psy-mnemonic font-mono">
                    {topic.mnemonic}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{topic.title}</CardTitle>
                <CardDescription>{topic.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="concepts">
                  <TabsList className="mb-4 flex h-auto flex-wrap">
                    <TabsTrigger value="concepts">Понятия</TabsTrigger>
                    <TabsTrigger value="takeaways">Выводы</TabsTrigger>
                    <TabsTrigger value="quiz">Квиз</TabsTrigger>
                  </TabsList>
                  <TabsContent value="concepts" className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Понятие</TableHead>
                          <TableHead>Смысл</TableHead>
                          <TableHead>Практический ориентир</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topic.concepts.map((concept) => (
                          <TableRow key={concept.term}>
                            <TableCell className="font-medium">
                              {concept.term}
                            </TableCell>
                            <TableCell>{concept.meaning}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {concept.signal}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="takeaways" className="grid gap-3">
                    {topic.takeaways.map((takeaway, index) => (
                      <div key={takeaway} className="flex gap-3 rounded-lg border p-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <p className="text-sm">{takeaway}</p>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="quiz">
                    <QuizPanel
                      moduleId={topic.id}
                      questions={topic.quiz}
                      completionTrack="ibm"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="kill-chain">
          <Card>
            <CardHeader>
              <CardTitle>Cyber Kill Chain: 7 этапов и точки защиты</CardTitle>
              <CardDescription>
                Линейная модель помогает спросить: где обнаружить или прервать
                конкретную атаку?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3 lg:grid-cols-2">
                {KILL_CHAIN.map((item, index) => (
                  <div key={item.stage} className="psy-highlight-card rounded-lg p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge>{index + 1}</Badge>
                      <strong>{item.ru}</strong>
                      <span className="text-sm text-muted-foreground">
                        / {item.stage}
                      </span>
                    </div>
                    <p className="text-sm">{item.detail}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong>Защита:</strong> {item.defense}
                    </p>
                  </div>
                ))}
              </div>
              <a href={asset('cyber-kill-chain.webp')} target="_blank" rel="noreferrer">
                <img
                  src={asset('cyber-kill-chain.webp')}
                  alt="Cyber Kill Chain из семи этапов"
                  className="max-h-[52rem] w-full rounded-lg border bg-white object-contain"
                />
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attack">
          <Card>
            <CardHeader>
              <CardTitle>MITRE ATT&amp;CK: тактики как цели атакующего</CardTitle>
              <CardDescription>
                Kill Chain показывает ход одной операции, ATT&amp;CK каталогизирует
                наблюдаемое поведение по тактикам и техникам.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ATTACK_TACTICS.map((tactic, index) => (
                  <div key={tactic} className="rounded-lg border bg-muted/40 p-3">
                    <span className="mr-2 font-mono text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium">{tactic}</span>
                  </div>
                ))}
              </div>
              <Typography tone="muted">
                Схема из архива является историческим снимком матрицы. Для
                операционной работы перечень техник нужно сверять с актуальной
                MITRE ATT&amp;CK, но базовая логика тактик остаётся полезной для
                обучения и threat modeling.
              </Typography>
              <a href={asset('attack-matrix.webp')} target="_blank" rel="noreferrer">
                <img
                  src={asset('attack-matrix.webp')}
                  alt="Матрица MITRE ATT&CK Enterprise"
                  className="w-full rounded-lg border bg-white object-contain"
                />
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}

type ReviewDirection = 'forward' | 'reverse'

export function ReviewPage() {
  const [track, setTrack] = useState<ReviewTrack | 'all'>('all')
  const [direction, setDirection] = useState<ReviewDirection>('forward')
  const [revealed, setRevealed] = useState(false)
  const [, setRevision] = useState(0)

  const dueCards = getDueCards(REVIEW_CARDS, track).slice(0, 20)
  const card = dueCards[0]
  const stats = getReviewStats(REVIEW_CARDS)
  const state = card ? getReviewState(card.id) : undefined

  function handleRate(rating: ReviewRating) {
    if (!card) return
    rateCard(card.id, rating)
    setRevealed(false)
    setRevision((value) => value + 1)
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 grid gap-4">
        <Badge variant="outline" className="w-fit">
          Локальный FSRS-inspired планировщик
        </Badge>
        <Typography variant="h1" className="psy-title text-3xl font-bold">
          Интервальное повторение
        </Typography>
        <Typography tone="muted">
          Карточки строятся из учебных таблиц. Оценка ответа меняет дату следующего
          показа; история хранится только в этом браузере.
        </Typography>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card size="sm">
            <CardContent>
              <strong>{stats.due}</strong>
              <p className="text-sm text-muted-foreground">готово к повторению</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <strong>{stats.learned}</strong>
              <p className="text-sm text-muted-foreground">уже просмотрено</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <strong>{stats.total}</strong>
              <p className="text-sm text-muted-foreground">всего карточек</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'linux', 'ibm'] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={track === value ? 'default' : 'outline'}
            onClick={() => {
              setTrack(value)
              setRevealed(false)
            }}
          >
            {value === 'all' ? 'Все' : value === 'linux' ? 'Linux' : 'IBM'}
          </Button>
        ))}
        <Button
          type="button"
          variant={direction === 'forward' ? 'secondary' : 'outline'}
          onClick={() => {
            setDirection('forward')
            setRevealed(false)
          }}
        >
          Понятие → ответ
        </Button>
        <Button
          type="button"
          variant={direction === 'reverse' ? 'secondary' : 'outline'}
          onClick={() => {
            setDirection('reverse')
            setRevealed(false)
          }}
        >
          Сигнал → понятие
        </Button>
      </div>

      {card ? (
        <Card className="psy-highlight-card">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{card.track.toUpperCase()}</Badge>
              <Badge variant="outline">{card.topic}</Badge>
              {state && (
                <Badge variant="secondary">
                  S {state.stability} · D {state.difficulty}
                </Badge>
              )}
            </div>
            <CardTitle className="pt-4 text-2xl">
              {direction === 'forward' ? card.prompt : card.cue}
            </CardTitle>
            {direction === 'forward' && (
              <CardDescription>{card.cue}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="grid gap-5">
            {!revealed ? (
              <Button type="button" onClick={() => setRevealed(true)}>
                Показать ответ
              </Button>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <Typography variant="h5">
                    {direction === 'forward' ? card.answer : card.prompt}
                  </Typography>
                  {direction === 'reverse' && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {card.answer}
                    </p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRate('again')}
                  >
                    Снова
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRate('hard')}
                  >
                    Трудно
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRate('good')}
                  >
                    Хорошо
                  </Button>
                  <Button type="button" onClick={() => handleRate('easy')}>
                    Легко
                  </Button>
                </div>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              В очереди сегодня: {dueCards.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Очередь пуста</CardTitle>
            <CardDescription>
              Для выбранной колоды нет карточек, срок которых уже наступил.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  )
}

const BRAIN_POSITIONS = new Map<string, { x: number; y: number }>(
  BRAIN_NODES.map((node) => {
    const peers = BRAIN_NODES.filter((item) => item.kind === node.kind)
    const index = peers.findIndex((item) => item.id === node.id)
    if (node.kind === 'linux') {
      return [
        node.id,
        {
          x: index < 6 ? 110 : 300,
          y: 75 + (index % 6) * 105,
        },
      ] as const
    }
    if (node.kind === 'ibm') {
      return [node.id, { x: 520, y: 75 + index * 105 }] as const
    }
    return [node.id, { x: 760, y: 245 + index * 210 }] as const
  }),
)

export function BrainMapPage() {
  const [selectedId, setSelectedId] = useState('security')
  const selected = BRAIN_NODES.find((node) => node.id === selectedId)!
  const connectedEdges = BRAIN_EDGES.filter(
    (edge) => edge.from === selectedId || edge.to === selectedId,
  )
  const connectedIds = new Set(
    connectedEdges.flatMap((edge) => [edge.from, edge.to]),
  )
  const selectedHref = `${import.meta.env.BASE_URL}${selected.href.replace(/^\//, '')}`

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 grid gap-3">
        <Badge variant="outline" className="w-fit">
          Linux ↔ IBM ↔ модели угроз
        </Badge>
        <Typography variant="h1" className="psy-title text-3xl font-bold">
          Интерактивная Brain Map
        </Typography>
        <Typography tone="muted" className="max-w-3xl">
          Выбери узел: карта оставит активными его связи и объяснит тип каждого
          ребра. Это навигационная модель курса, а не просто иллюстрация.
        </Typography>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="overflow-hidden">
          <CardContent className="p-2 sm:p-4">
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 880 700"
                className="min-w-[760px]"
                role="img"
                aria-label="Карта связей Linux и информационной безопасности"
              >
                <text x="110" y="28" textAnchor="middle" className="fill-current text-sm font-bold">
                  Linux
                </text>
                <text x="520" y="28" textAnchor="middle" className="fill-current text-sm font-bold">
                  IBM Cyber
                </text>
                <text x="760" y="198" textAnchor="middle" className="fill-current text-sm font-bold">
                  Models
                </text>

                {BRAIN_EDGES.map((edge) => {
                  const from = BRAIN_POSITIONS.get(edge.from)!
                  const to = BRAIN_POSITIONS.get(edge.to)!
                  const active =
                    edge.from === selectedId || edge.to === selectedId
                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={active ? 'oklch(0.78 0.15 52)' : 'oklch(0.45 0.08 42)'}
                      strokeWidth={active ? 3 : 1}
                      opacity={active ? 0.95 : 0.32}
                    />
                  )
                })}

                {BRAIN_NODES.map((node) => {
                  const position = BRAIN_POSITIONS.get(node.id)!
                  const selectedNode = node.id === selectedId
                  const active = selectedNode || connectedIds.has(node.id)
                  const fill =
                    node.kind === 'linux'
                      ? 'oklch(0.58 0.14 35)'
                      : node.kind === 'ibm'
                        ? 'oklch(0.55 0.12 145)'
                        : 'oklch(0.52 0.16 328)'
                  return (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      aria-label={node.label}
                      onClick={() => setSelectedId(node.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          setSelectedId(node.id)
                        }
                      }}
                      className="cursor-pointer outline-none"
                      opacity={active ? 1 : 0.42}
                    >
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={selectedNode ? 42 : 35}
                        fill={fill}
                        stroke={selectedNode ? 'oklch(0.92 0.08 80)' : 'oklch(0.75 0.08 70)'}
                        strokeWidth={selectedNode ? 4 : 1.5}
                      />
                      <text
                        x={position.x}
                        y={position.y + 4}
                        textAnchor="middle"
                        className="pointer-events-none fill-white text-[10px] font-bold"
                      >
                        {node.label.length > 15
                          ? `${node.label.slice(0, 14)}…`
                          : node.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div className="flex gap-2">
              <Badge>{selected.kind.toUpperCase()}</Badge>
              <Badge variant="outline">{connectedEdges.length} связей</Badge>
            </div>
            <CardTitle>{selected.label}</CardTitle>
            <CardDescription>{selected.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {connectedEdges.map((edge) => {
              const otherId = edge.from === selectedId ? edge.to : edge.from
              const other = BRAIN_NODES.find((node) => node.id === otherId)!
              return (
                <button
                  key={`${edge.from}-${edge.to}`}
                  type="button"
                  onClick={() => setSelectedId(otherId)}
                  className="rounded-lg border p-3 text-left hover:bg-muted/50"
                >
                  <strong className="text-sm">{other.label}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {edge.relation}
                  </p>
                </button>
              )
            })}
            <Button asChild>
              <a href={selectedHref}>Открыть учебный раздел</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export function GlossaryPage() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const grouped = useMemo(() => getGlossaryByCategory(), [])
  const filtered = useMemo(() => {
    if (!q) return grouped
    return grouped
      .map((g) => ({
        category: g.category,
        terms: g.terms.filter((t) =>
          [t.term, t.short, t.category, ...t.aliases, ...t.body]
            .join(' ')
            .toLowerCase()
            .includes(q),
        ),
      }))
      .filter((g) => g.terms.length > 0)
  }, [q, grouped])

  const catAnchor = (category: string) => `cat-${GLOSSARY_CATEGORIES.indexOf(category)}`
  const shown = filtered.reduce((n, g) => n + g.terms.length, 0)

  // Scroll to the term anchor on arrival from a module link (/glossary#term-id) and on
  // later in-page hash changes. rAF lets the list paint before we measure; decode is guarded.
  useEffect(() => {
    const scrollToHash = () => {
      let id = ''
      try {
        id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      } catch {
        return
      }
      if (!id) return
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ block: 'start' })
      })
    }
    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 grid gap-3">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          Глоссарий ядра Linux · {GLOSSARY.length} терминов
        </Badge>
        <Typography variant="h1" className="psy-title text-3xl font-bold sm:text-4xl">
          Глоссарий
        </Typography>
        <Typography tone="muted" className="max-w-2xl">
          Краткие точные определения с привязкой к модулям. Поиск идёт по названию,
          синониму и тексту определения.
        </Typography>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск термина…"
          aria-label="Поиск по глоссарию"
          className="w-full max-w-md rounded-lg border border-border/80 bg-card/80 px-3 py-2 text-sm outline-none focus:border-accent/60"
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {filtered.map((g) => (
          <a key={g.category} href={`#${catAnchor(g.category)}`}>
            <Badge variant="secondary" className="cursor-pointer">
              {g.category}
            </Badge>
          </a>
        ))}
      </div>

      {shown === 0 && (
        <Typography tone="muted">Ничего не найдено по запросу «{query}».</Typography>
      )}

      <div className="grid gap-10">
        {filtered.map((g) => (
          <div key={g.category} id={catAnchor(g.category)} className="scroll-mt-20">
            <Typography variant="h2" className="psy-title mb-4 text-2xl font-bold">
              {g.category}
            </Typography>
            <div className="grid gap-4">
              {g.terms.map((t) => (
                <Card key={t.id} id={t.id} className="scroll-mt-20 border-border/80 bg-card/90">
                  <CardHeader>
                    <CardTitle className="text-lg">{t.term}</CardTitle>
                    <CardDescription>{t.short}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {t.body.map((para, idx) => (
                      <Typography key={`${t.id}-p${idx}`} tone="muted" className="leading-relaxed">
                        {para}
                      </Typography>
                    ))}
                    {t.modules.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">В модулях:</span>
                        {t.modules.map((mid) => {
                          const m = getModule(mid)
                          if (!m) return null
                          return (
                            <Link key={mid} to="/module/$moduleId" params={{ moduleId: mid }}>
                              <Badge variant="outline" className="cursor-pointer">
                                {m.number}. {m.title}
                              </Badge>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                    {t.seeAlso.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">См. также:</span>
                        {t.seeAlso.map((sid) => {
                          const s = getTerm(sid)
                          if (!s) return null
                          return (
                            <a key={sid} href={`#${sid}`}>
                              <Badge variant="secondary" className="cursor-pointer">
                                {s.term}
                              </Badge>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const TIMELINE_KIND: Record<TimelineEventKind, { label: string; cls: string }> = {
  kernel: {
    label: 'Ядро Linux',
    cls: 'border-[oklch(0.72_0.17_48/0.5)] bg-[oklch(0.72_0.17_48/0.12)] text-[oklch(0.9_0.08_70)]',
  },
  feature: {
    label: 'Возможность ядра',
    cls: 'border-[oklch(0.7_0.13_165/0.5)] bg-[oklch(0.7_0.13_165/0.12)] text-[oklch(0.88_0.09_168)]',
  },
  project: {
    label: 'Проект',
    cls: 'border-[oklch(0.65_0.16_265/0.5)] bg-[oklch(0.65_0.16_265/0.12)] text-[oklch(0.85_0.1_265)]',
  },
  distro: {
    label: 'Дистрибутив',
    cls: 'border-[oklch(0.66_0.2_350/0.5)] bg-[oklch(0.66_0.2_350/0.12)] text-[oklch(0.86_0.12_350)]',
  },
  unix: {
    label: 'Unix · GNU',
    cls: 'border-border bg-muted/40 text-muted-foreground',
  },
  milestone: {
    label: 'Веха',
    cls: 'border-[oklch(0.7_0.14_95/0.5)] bg-[oklch(0.7_0.14_95/0.12)] text-[oklch(0.88_0.09_98)]',
  },
}

export function TimelinePage() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const grouped = useMemo(() => getTimelineByEra(), [])
  const filtered = useMemo(() => {
    if (!q) return grouped
    return grouped
      .map((g) => ({
        era: g.era,
        events: g.events.filter((e) =>
          [e.title, e.short, e.dateLabel, ...e.body].join(' ').toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.events.length > 0)
  }, [q, grouped])

  const eraAnchor = (id: string) => `era-${id}`
  const shown = filtered.reduce((n, g) => n + g.events.length, 0)

  // Scroll to an event/era anchor on arrival (#event-id, #era-…) and on later in-page
  // hash changes (cross-event «См. также» links). rAF lets the list paint before we measure.
  useEffect(() => {
    const scrollToHash = () => {
      let id = ''
      try {
        id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      } catch {
        return
      }
      if (!id) return
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ block: 'start' })
      })
    }
    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 grid gap-3">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          Хронология Linux · {TIMELINE.length} событий
        </Badge>
        <Typography variant="h1" className="psy-title text-3xl font-bold sm:text-4xl">
          Хронология
        </Typography>
        <Typography tone="muted" className="max-w-2xl">
          Путь от Unix 1969 года до современного ядра: ключевые релизы, подсистемы и события,
          сделавшие Linux таким, какой он есть. Знакомые термины в тексте ведут в глоссарий.
        </Typography>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по событиям…"
          aria-label="Поиск по хронологии"
          className="w-full max-w-md rounded-lg border border-border/80 bg-card/80 px-3 py-2 text-sm outline-none focus:border-accent/60"
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {filtered.map((g) => (
          <a key={g.era.id} href={`#${eraAnchor(g.era.id)}`}>
            <Badge variant="secondary" className="cursor-pointer">
              {g.era.label}
            </Badge>
          </a>
        ))}
      </div>

      {shown === 0 && (
        <Typography tone="muted">Ничего не найдено по запросу «{query}».</Typography>
      )}

      <div className="grid gap-12">
        {filtered.map((g) => (
          <div key={g.era.id} id={eraAnchor(g.era.id)} className="scroll-mt-20">
            <Typography variant="h2" className="psy-title mb-1 text-2xl font-bold">
              {g.era.label}
            </Typography>
            <Typography tone="muted" className="mb-5 max-w-2xl text-sm">
              {g.era.blurb}
            </Typography>
            <ol className="relative ml-3 border-l border-border/60">
              {g.events.map((ev) => {
                const seen = new Set<string>()
                const kind = TIMELINE_KIND[ev.kind]
                return (
                  <li key={ev.id} className="relative ml-6 pb-8 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute left-[-1.875rem] top-6 h-3 w-3 rounded-full border-2 border-background bg-accent shadow-[0_0_8px_oklch(0.72_0.17_48/0.5)]"
                    />
                    <Card id={ev.id} className="scroll-mt-20 border-border/80 bg-card/90">
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-accent/50 font-mono text-xs">
                            {ev.dateLabel}
                          </Badge>
                          <Badge variant="outline" className={cn('text-xs', kind.cls)}>
                            {kind.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{ev.title}</CardTitle>
                        <CardDescription>{ev.short}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        {ev.body.map((para, idx) => (
                          <Typography
                            key={`${ev.id}-p${idx}`}
                            tone="muted"
                            className="leading-relaxed"
                          >
                            {linkifyProse(para, seen)}
                          </Typography>
                        ))}
                        {ev.modules.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">Модули:</span>
                            {ev.modules.map((mid) => {
                              const m = getModule(mid)
                              if (!m) return null
                              return (
                                <Link key={mid} to="/module/$moduleId" params={{ moduleId: mid }}>
                                  <Badge variant="outline" className="cursor-pointer">
                                    {m.number}. {m.title}
                                  </Badge>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                        {ev.glossary.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">Термины:</span>
                            {ev.glossary.map((tid) => {
                              const t = getTerm(tid)
                              if (!t) return null
                              return (
                                <Link key={tid} to="/glossary" hash={tid}>
                                  <Badge variant="secondary" className="cursor-pointer">
                                    {t.term}
                                  </Badge>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                        {ev.seeAlso && ev.seeAlso.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">См. также:</span>
                            {ev.seeAlso.map((sid) => {
                              const s = getEvent(sid)
                              if (!s) return null
                              return (
                                <a key={sid} href={`#${sid}`}>
                                  <Badge variant="secondary" className="cursor-pointer">
                                    {s.title}
                                  </Badge>
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ComparePage() {
  const tableAnchor = (id: string) => `cmp-${id}`

  // Scroll to a table anchor on arrival and on later in-page hash changes (jump chips).
  useEffect(() => {
    const scrollToHash = () => {
      let id = ''
      try {
        id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      } catch {
        return
      }
      if (!id) return
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ block: 'start' })
      })
    }
    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 grid gap-3">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          Сравнения · {COMPARE_TABLES.length} таблицы
        </Badge>
        <Typography variant="h1" className="psy-title text-3xl font-bold sm:text-4xl">
          Сравнения
        </Typography>
        <Typography tone="muted" className="max-w-2xl">
          Сквозные таблицы рядом: планировщики, файловые системы и механизмы IPC. Удобно увидеть,
          чем варианты отличаются на одной оси. Знакомые термины в подписях ведут в глоссарий.
        </Typography>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {COMPARE_TABLES.map((t) => (
          <a key={t.id} href={`#${tableAnchor(t.id)}`}>
            <Badge variant="secondary" className="cursor-pointer">
              {t.title}
            </Badge>
          </a>
        ))}
      </div>

      <div className="grid gap-10">
        {COMPARE_TABLES.map((t) => {
          const seen = new Set<string>()
          return (
            <Card
              key={t.id}
              id={tableAnchor(t.id)}
              className="scroll-mt-20 border-border/80 bg-card/90"
            >
              <CardHeader>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                {t.intro && (
                  <CardDescription className="leading-relaxed">
                    {linkifyProse(t.intro, seen)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {t.columns.map((col) => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {t.rows.map((row, ri) => (
                        <TableRow key={`${t.id}-r${ri}`}>
                          {row.cells.map((cell, ci) => {
                            const linked =
                              ci === 0 && row.glossaryId && getTerm(row.glossaryId)
                            return (
                              <TableCell
                                key={`${t.id}-r${ri}-c${ci}`}
                                className={
                                  ci === 0
                                    ? 'font-medium text-foreground'
                                    : 'text-sm text-muted-foreground'
                                }
                              >
                                {linked ? (
                                  <Link
                                    to="/glossary"
                                    hash={row.glossaryId}
                                    className="underline-offset-2 hover:underline"
                                  >
                                    {cell}
                                  </Link>
                                ) : (
                                  cell
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {t.modules && t.modules.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Модули:</span>
                    {t.modules.map((mid) => {
                      const m = getModule(mid)
                      if (!m) return null
                      return (
                        <Link key={mid} to="/module/$moduleId" params={{ moduleId: mid }}>
                          <Badge variant="outline" className="cursor-pointer">
                            {m.number}. {m.title}
                          </Badge>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
