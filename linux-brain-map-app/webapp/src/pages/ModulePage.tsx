import { Link, useParams } from '@tanstack/react-router'

import { CopyButton } from '@/components/CopyButton'
import { DiagramView, decisionsToDiagram } from '@/components/DiagramView'
import { linkifyProse } from '@/components/GlossaryLinker'
import { QuizPanel } from '@/components/QuizPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { MODULE_DIAGRAMS } from '@/data/module-diagrams'
import { MODULES, getModule } from '@/data/modules'
import { bashCmd, pythonCmd } from '@/data/toolkit'
import { markModuleComplete } from '@/lib/progress'

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

