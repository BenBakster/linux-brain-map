import { useMemo } from 'react'

import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import { HYGIENE_ITEMS } from '@/data/hygiene'
import {
  toggleHygieneItem,
  useHygiene,
  useHygienePercent,
} from '@/lib/progress'
import { cn } from '@/lib/utils'

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

