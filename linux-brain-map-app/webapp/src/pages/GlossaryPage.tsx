import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  getGlossaryByCategory,
  getTerm,
} from '@/data/glossary'
import { getModule } from '@/data/modules'

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

