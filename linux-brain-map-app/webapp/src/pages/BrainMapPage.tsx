import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { BRAIN_EDGES, BRAIN_NODES } from '@/data/brain-map'

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

