import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { linkifyProse } from '@/components/GlossaryLinker'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { getTerm } from '@/data/glossary'
import { getModule } from '@/data/modules'
import {
  TIMELINE,
  getEvent,
  getTimelineByEra,
  type TimelineEventKind,
} from '@/data/timeline'
import { cn } from '@/lib/utils'

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

