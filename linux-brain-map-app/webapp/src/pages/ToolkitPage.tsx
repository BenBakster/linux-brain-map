import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { PYTHON_SCRIPTS, TOOLKIT_SCRIPTS, bashCmd, pythonCmd } from '@/data/toolkit'

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

