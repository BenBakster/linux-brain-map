import { Link } from '@tanstack/react-router'

import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { MODULES } from '@/data/modules'
import { useCompletionPercent, useProgress } from '@/lib/progress'
import { cn } from '@/lib/utils'

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

