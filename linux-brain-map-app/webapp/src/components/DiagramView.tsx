import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { Diagram, DiagramNodeKind } from '@/data/diagram'
import { describeTransitions, layoutDiagram, type DiagramLayout } from '@/lib/diagram-layout'
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

// Превью вписывается в ширину колонки; ниже этого масштаба не ужимаем —
// мелкий текст нечитаем, лучше отдать пользователю горизонтальный скролл.
const FIT_FLOOR = 0.55
// Во весь экран маленькую схему увеличиваем, но не до гротеска.
const FS_MAX_SCALE = 2.4

/**
 * Ширина/высота элемента через ResizeObserver. ref-callback (а не useEffect)
 * — чтобы пережить условный монтаж: overlay появляется только в fullscreen,
 * и наблюдатель должен подцепиться к нему ровно в момент появления.
 */
function useElementSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observer = useRef<ResizeObserver | null>(null)
  const setRef = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })
    ro.observe(el)
    observer.current = ro
    // Засев сразу: первый кадр не должен ждать первого срабатывания наблюдателя.
    setSize({ width: el.clientWidth, height: el.clientHeight })
  }, [])
  return [setRef, size] as const
}

/** Полотно схемы: полосы-дорожки, рёбра-стрелки, узлы. Чистый рендер раскладки —
 *  переиспользуется и в превью, и в полноэкранном overlay. */
function DiagramCanvas({ layout, markerId }: { layout: DiagramLayout; markerId: string }) {
  const { nodes, edges, lanes, width, height } = layout
  return (
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
  )
}

export function DiagramView({ diagram, className }: DiagramViewProps) {
  const rawId = useId()
  const markerId = `arw-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const layout = layoutDiagram(diagram)
  const { nodes, width, height } = layout
  const transitions = describeTransitions(diagram)

  const [fitRef, fitSize] = useElementSize()
  const [stageRef, stageSize] = useElementSize()
  const [fullscreen, setFullscreen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Пока открыт overlay: Esc закрывает, фон не прокручивается, фокус заперт
  // внутри (в модалке один фокусируемый элемент — ✕), на закрытии — назад на ⛶.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreen(false)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        closeRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      triggerRef.current?.focus()
    }
  }, [fullscreen])

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Схема пока не задана.</p>
  }

  const usedKinds = uniqueKinds(diagram)
  const usedEdgeKinds = new Set(diagram.edges.map((e) => e.kind ?? 'seq'))

  // Превью: вписать в ширину колонки (масштаб ≤ 1, не ниже пола → иначе скролл).
  const fitScale = fitSize.width > 0 ? Math.max(FIT_FLOOR, Math.min(1, fitSize.width / width)) : 1
  // Overlay: вписать ЦЕЛИКОМ по обеим сторонам, мелкую схему увеличить до потолка.
  const fsScale =
    stageSize.width > 0 && stageSize.height > 0
      ? Math.min(stageSize.width / width, stageSize.height / height, FS_MAX_SCALE)
      : 1

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      <div className="psy-diagram-frame">
        <div ref={fitRef} className="psy-diagram-scroll">
          {/* Внешний блок занимает масштабированный размер (управляет потоком),
              внутренний — реальную геометрию, ужатую transform-ом. */}
          <div style={{ width: width * fitScale, height: height * fitScale }}>
            <div style={{ width, height, transform: `scale(${fitScale})`, transformOrigin: 'top left' }}>
              <DiagramCanvas layout={layout} markerId={markerId} />
            </div>
          </div>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="psy-diagram-fs-btn"
          onClick={() => setFullscreen(true)}
          title="Во весь экран"
          aria-label="Показать схему во весь экран"
        >
          ⛶
        </button>
      </div>

      {transitions.length > 0 && (
        <div className="sr-only">
          <p>Переходы схемы (текстовая альтернатива к стрелкам):</p>
          <ul>
            {transitions.map((t, i) => (
              <li key={`${i}-${t}`}>{t}</li>
            ))}
          </ul>
        </div>
      )}

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

      {fullscreen &&
        createPortal(
          <div
            className="psy-diagram-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Схема механизма — во весь экран"
            onClick={() => setFullscreen(false)}
          >
            <button
              ref={closeRef}
              type="button"
              className="psy-diagram-fs-btn psy-diagram-fs-close"
              onClick={(e) => {
                e.stopPropagation()
                setFullscreen(false)
              }}
              title="Закрыть (Esc)"
              aria-label="Закрыть полноэкранный режим"
            >
              ✕
            </button>
            <div ref={stageRef} className="psy-diagram-overlay-stage">
              <div
                style={{ width: width * fsScale, height: height * fsScale }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ width, height, transform: `scale(${fsScale})`, transformOrigin: 'top left' }}>
                  <DiagramCanvas layout={layout} markerId={`${markerId}-fs`} />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
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
