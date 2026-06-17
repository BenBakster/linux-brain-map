import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { linkifyProse } from '@/components/GlossaryLinker'
import { Badge } from '@/components/ui/badge'
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
import { Typography } from '@/components/ui/typography'
import { COMPARE_TABLES } from '@/data/compare'
import { getTerm } from '@/data/glossary'
import { getModule } from '@/data/modules'

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
