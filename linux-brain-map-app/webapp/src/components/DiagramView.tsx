import { useId } from 'react'

import type { Diagram, DiagramNodeKind } from '@/data/diagram'
import { layoutDiagram } from '@/lib/diagram-layout'
import { cn } from '@/lib/utils'

type DiagramViewProps = {
  diagram: Diagram
  className?: string
}

// Цвета стрелок совпадают с обводкой соответствующих рёбер в index.css.
// Явный fill (а не context-stroke) — ради старых браузеров.
const EDGE_KINDS = ['seq', 'branch', 'loop', 'parallel'] as const
const EDGE_COLORS: Record<(typeof EDGE_KINDS)[number], string> = {
  seq: 'oklch(0.62 0.13 50 / 0.78)',
  branch: 'oklch(0.78 0.14 82 / 0.88)',
  loop: 'oklch(0.66 0.1 45 / 0.72)',
  parallel: 'oklch(0.62 0.08 205 / 0.72)',
}

const KIND_RU: Record<DiagramNodeKind, string> = {
  start: 'вход',
  process: 'шаг',
  decision: 'развилка',
  state: 'состояние',
  data: 'структура / интерфейс',
  resource: 'железо',
  danger: 'плохой исход',
  end: 'выход',
}

export function DiagramView({ diagram, className }: DiagramViewProps) {
  const rawId = useId()
  const markerId = `arw-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const { nodes, edges, lanes, width, height } = layoutDiagram(diagram)

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Схема пока не задана.</p>
  }

  const usedKinds = uniqueKinds(diagram)
  const usedEdgeKinds = new Set(diagram.edges.map((e) => e.kind ?? 'seq'))

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="psy-diagram-scroll">
        <div className="relative" style={{ width, height, minWidth: width }}>
          {lanes.map((lane) => (
            <div key={lane.id} className="psy-lane-band" style={{ top: lane.y, height: lane.height }}>
              <span className="psy-lane-label">{lane.label}</span>
            </div>
          ))}

          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            style={{ pointerEvents: 'none', zIndex: 1 }}
            aria-hidden
          >
            <defs>
              {EDGE_KINDS.map((k) => (
                <marker
                  key={k}
                  id={`${markerId}-${k}`}
                  markerWidth="9"
                  markerHeight="9"
                  refX="7.5"
                  refY="3.5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0,0 L7.5,3.5 L0,7 Z" fill={EDGE_COLORS[k]} />
                </marker>
              ))}
            </defs>
            {edges.map((edge, index) => {
              const kind = edge.kind ?? 'seq'
              return (
                <g key={`${edge.from}-${edge.to}-${kind}-${edge.label ?? ''}-${index}`}>
                  <path
                    d={edge.path}
                    className={cn(
                      'psy-dedge',
                      kind === 'branch' && 'psy-dedge--branch',
                      kind === 'loop' && 'psy-dedge--loop',
                      kind === 'parallel' && 'psy-dedge--parallel',
                    )}
                    markerEnd={`url(#${markerId}-${kind})`}
                  />
                  {edge.label && (
                    <text x={edge.labelX} y={edge.labelY} textAnchor="middle" className="psy-edge-label">
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              data-kind={node.kind ?? 'process'}
              className="psy-dnode"
              style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
              title={node.detail ? `${node.label} — ${node.detail}` : node.label}
            >
              <span className="psy-dnode-label">{node.label}</span>
              {node.detail && <span className="psy-dnode-detail">{node.detail}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {usedKinds.map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span
              data-kind={kind}
              className="psy-dnode"
              style={{ position: 'static', width: 14, height: 14, padding: 0, borderRadius: 4 }}
              aria-hidden
            />
            {KIND_RU[kind]}
          </span>
        ))}
        {usedEdgeKinds.has('branch') && <span>— жёлтая стрелка с подписью: ветвление по условию</span>}
        {usedEdgeKinds.has('loop') && <span>— пунктир-дуга: цикл / возврат</span>}
        {usedEdgeKinds.has('parallel') && <span>— точечная: параллельная ветка</span>}
      </div>
    </div>
  )
}

function uniqueKinds(diagram: Diagram): DiagramNodeKind[] {
  const order: DiagramNodeKind[] = ['start', 'process', 'decision', 'state', 'data', 'resource', 'danger', 'end']
  const present = new Set<DiagramNodeKind>(diagram.nodes.map((n) => n.kind ?? 'process'))
  return order.filter((k) => present.has(k))
}

/**
 * Адаптер: дерево решений (condition → action) в граф-диаграмму, чтобы
 * вкладка «Решения» рисовалась тем же движком (настоящим деревом), а не
 * плоским списком. Корень-развилка ветвится на действия по условиям.
 */
export function decisionsToDiagram(decisions: { condition: string; action: string }[]): Diagram {
  const nodes: Diagram['nodes'] = [{ id: 'root', label: 'Что наблюдаем?', kind: 'decision' }]
  const edges: Diagram['edges'] = []
  decisions.forEach((d, i) => {
    const id = `act-${i}`
    nodes.push({ id, label: d.action, kind: 'process' })
    edges.push({ from: 'root', to: id, kind: 'branch', label: d.condition })
  })
  return { nodes, edges }
}
