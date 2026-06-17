import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
// Во весь экран маленькую схему увеличиваем «вписать целиком», но не до
// гротеска; это же значение — нижняя граница ручного зума.
const FS_MAX_SCALE = 2.4
// Потолок ручного зума (доля натурального размера полотна).
const FS_ZOOM_MAX = 4
// Шаг панорамы стрелками клавиатуры, px экрана.
const PAN_STEP = 60

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

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
 *  переиспользуется и в превью, и в полноэкранном overlay. memo: зум/пан дёргают
 *  множество ре-рендеров родителя, а само полотно от них не меняется (transform
 *  живёт на обёртке) — пересобирать весь SVG на каждый кадр незачем. */
const DiagramCanvas = memo(function DiagramCanvas({
  layout,
  markerId,
}: {
  layout: DiagramLayout
  markerId: string
}) {
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
              markerWidth="13"
              markerHeight="12"
              refX="10.5"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L11,5 L0,10 Z" fill={EDGE_COLORS[k]} />
            </marker>
          ))}
        </defs>
        {/* Два прохода: сначала ВСЕ линии, затем ВСЕ подписи — так плашка подписи
            перекрывает любую линию (а не только собственную), и текст ни на что
            не налезает. */}
        {edges.map((edge, index) => {
          const kind = edge.kind ?? 'seq'
          return (
            <path
              key={`p-${edge.from}-${edge.to}-${kind}-${edge.label ?? ''}-${index}`}
              d={edge.path}
              className={cn(
                'psy-dedge',
                kind === 'branch' && 'psy-dedge--branch',
                kind === 'loop' && 'psy-dedge--loop',
                kind === 'parallel' && 'psy-dedge--parallel',
              )}
              markerEnd={`url(#${markerId}-${kind})`}
            />
          )
        })}
        {edges.map((edge, index) => {
          if (!edge.label) return null
          const kind = edge.kind ?? 'seq'
          return (
            <g key={`l-${edge.from}-${edge.to}-${kind}-${edge.label}-${index}`}>
              {/* Скруглённая тёмная плашка под подписью: текст читается поверх
                  линий и узлов; rx — лёгкое скругление углов плашки. */}
              <rect
                className="psy-edge-label-plate"
                x={edge.labelX - edge.labelW / 2}
                y={edge.labelY - edge.labelH / 2}
                width={edge.labelW}
                height={edge.labelH}
                rx="4"
              />
              <text
                x={edge.labelX}
                y={edge.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="psy-edge-label"
              >
                {edge.label}
              </text>
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
})

export function DiagramView({ diagram, className }: DiagramViewProps) {
  const rawId = useId()
  const markerId = `arw-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  // Раскладка/переходы зависят только от схемы — мемоизируем: зум/пан вызывают
  // частые ре-рендеры, пересчитывать граф на каждый кадр незачем.
  const layout = useMemo(() => layoutDiagram(diagram), [diagram])
  const transitions = useMemo(() => describeTransitions(diagram), [diagram])
  const { nodes, width, height } = layout

  const [fitRef, fitSize] = useElementSize()
  const [stageRef, stageSize] = useElementSize()
  const [fullscreen, setFullscreen] = useState(false)
  // Полноэкранный вид: масштаб + смещение полотна (translate+scale). null —
  // ещё не вписан (стейдж не измерен); первый кадр считаем по fitBase инлайн.
  const [view, setView] = useState<{ scale: number; x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const stageElRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  // Базовый масштаб «вписать целиком» (он же нижняя граница зума): по узкой
  // стороне, мелкую схему не раздуваем выше FS_MAX_SCALE.
  const fitBase =
    stageSize.width > 0 && stageSize.height > 0
      ? Math.min(stageSize.width / width, stageSize.height / height, FS_MAX_SCALE)
      : 1
  const zoomMax = Math.max(FS_ZOOM_MAX, fitBase)

  // Смещение для центрирования полотна данного масштаба в стейдже.
  const centeredOffset = useCallback(
    (s: number) => ({
      x: (stageSize.width - width * s) / 2,
      y: (stageSize.height - height * s) / 2,
    }),
    [stageSize.width, stageSize.height, width, height],
  )

  // Кламп смещения «как в просмотрщике картинок»: полотно уже вьюпорта по оси
  // → центрируем и пан по этой оси запрещён; шире → край нельзя утащить внутрь.
  const clampOffset = useCallback(
    (s: number, x: number, y: number) => {
      const sw = width * s
      const sh = height * s
      const cx = sw <= stageSize.width ? (stageSize.width - sw) / 2 : clamp(x, stageSize.width - sw, 0)
      const cy = sh <= stageSize.height ? (stageSize.height - sh) / 2 : clamp(y, stageSize.height - sh, 0)
      return { x: cx, y: cy }
    },
    [stageSize.width, stageSize.height, width, height],
  )

  // Привести «сырое» состояние к валидному виду: масштаб в [fitBase, zoomMax],
  // смещение — в границы клампа. Используется и для рендера, и как база любой
  // мутации → вид само-исцеляется после ресайза без эффектов-сеттеров.
  const deriveView = useCallback(
    (raw: { scale: number; x: number; y: number } | null) => {
      const base = raw ?? { scale: fitBase, ...centeredOffset(fitBase) }
      const s = clamp(base.scale, fitBase, zoomMax)
      return { scale: s, ...clampOffset(s, base.x, base.y) }
    },
    [fitBase, zoomMax, centeredOffset, clampOffset],
  )

  // Зум множителем с якорем (cx,cy) в координатах стейджа: точка под якорем
  // остаётся на месте. Без якоря — центр стейджа (кнопки/клавиатура).
  const zoomByFactor = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      setView((prev) => {
        const cur = deriveView(prev)
        const next = clamp(cur.scale * factor, fitBase, zoomMax)
        if (next === cur.scale) return cur
        const ax = cx ?? stageSize.width / 2
        const ay = cy ?? stageSize.height / 2
        const k = next / cur.scale
        return { scale: next, ...clampOffset(next, ax - (ax - cur.x) * k, ay - (ay - cur.y) * k) }
      })
    },
    [deriveView, fitBase, zoomMax, clampOffset, stageSize.width, stageSize.height],
  )

  // Абсолютное смещение (перетаскивание), масштаб не трогаем.
  const panTo = useCallback(
    (x: number, y: number) =>
      setView((prev) => {
        const cur = deriveView(prev)
        return { scale: cur.scale, ...clampOffset(cur.scale, x, y) }
      }),
    [deriveView, clampOffset],
  )

  // Относительное смещение (стрелки клавиатуры).
  const panBy = useCallback(
    (dx: number, dy: number) =>
      setView((prev) => {
        const cur = deriveView(prev)
        return { scale: cur.scale, ...clampOffset(cur.scale, cur.x + dx, cur.y + dy) }
      }),
    [deriveView, clampOffset],
  )

  const resetView = useCallback(
    () => setView({ scale: fitBase, ...centeredOffset(fitBase) }),
    [fitBase, centeredOffset],
  )

  // Открытие/закрытие overlay: блок прокрутки фона, фокус на ✕ при открытии,
  // на закрытии — назад на ⛶ (сам вид сбрасывается в обработчике открытия).
  // Инициализация и ресайз не требуют эффектов: рендер всегда берёт
  // deriveView(view), а мутации стартуют от него же → вид валиден сам по себе.
  useEffect(() => {
    if (!fullscreen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      triggerRef.current?.focus()
    }
  }, [fullscreen])

  // Клавиатура в overlay: Esc — закрыть; Tab — ловушка фокуса по всем кнопкам;
  // +/-/0 — зум/сброс; стрелки — пан. Переподписка при смене колбэков (ресайз).
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreen(false)
        return
      }
      if (e.key === 'Tab') {
        const focusables = overlayRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        } else if (active instanceof Node && !overlayRef.current?.contains(active)) {
          e.preventDefault()
          first.focus()
        }
        return
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomByFactor(1.25)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomByFactor(1 / 1.25)
      } else if (e.key === '0') {
        e.preventDefault()
        resetView()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const dx = e.key === 'ArrowLeft' ? PAN_STEP : e.key === 'ArrowRight' ? -PAN_STEP : 0
        const dy = e.key === 'ArrowUp' ? PAN_STEP : e.key === 'ArrowDown' ? -PAN_STEP : 0
        panBy(dx, dy)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, zoomByFactor, resetView, panBy])

  // Зум колесом к курсору. React делает onWheel ПАССИВНЫМ → preventDefault там
  // не сработает; вешаем ручной non-passive листенер на узел сцены.
  useEffect(() => {
    const node = stageElRef.current
    if (!fullscreen || !node) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = node.getBoundingClientRect()
      // Нормализуем deltaMode (строки/страницы) к пикселям, иначе колесо «мыши
      // по строкам» почти не зумит.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? node.clientHeight : 1
      const factor = Math.exp(-e.deltaY * unit * 0.0015)
      zoomByFactor(factor, e.clientX - rect.left, e.clientY - rect.top)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [fullscreen, zoomByFactor])

  // Объединённый ref сцены: и для ResizeObserver, и для прямого доступа к узлу
  // (ручной wheel-листенер выше).
  const setStageRef = useCallback(
    (el: HTMLDivElement | null) => {
      stageElRef.current = el
      stageRef(el)
    },
    [stageRef],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      if (!d) return
      panTo(d.ox + (e.clientX - d.px), d.oy + (e.clientY - d.py))
    },
    [panTo],
  )

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // указатель мог быть уже отпущен — не критично
    }
  }, [])

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Схема пока не задана.</p>
  }

  const usedKinds = uniqueKinds(diagram)
  const usedEdgeKinds = new Set(diagram.edges.map((e) => e.kind ?? 'seq'))

  // Превью: вписать в ширину колонки (масштаб ≤ 1, не ниже пола → иначе скролл).
  const fitScale = fitSize.width > 0 ? Math.max(FIT_FLOOR, Math.min(1, fitSize.width / width)) : 1
  // Полноэкранный вид: всегда валидный (вписан по умолчанию, поджат под границы).
  const v = deriveView(view)
  const atMin = v.scale <= fitBase + 1e-3
  const atMax = v.scale >= zoomMax - 1e-3

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
          onClick={() => {
            // Сброс вида при открытии: каждый раз начинаем с «вписать целиком».
            setView(null)
            setFullscreen(true)
          }}
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
            ref={overlayRef}
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

            <div
              ref={setStageRef}
              className="psy-diagram-overlay-stage"
              data-dragging={dragging ? 'true' : undefined}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                dragRef.current = { px: e.clientX, py: e.clientY, ox: v.x, oy: v.y }
                setDragging(true)
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="psy-diagram-pan"
                style={{
                  width,
                  height,
                  transform: `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <DiagramCanvas layout={layout} markerId={`${markerId}-fs`} />
              </div>
            </div>

            <div className="psy-diagram-fs-toolbar" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="psy-diagram-fs-btn"
                onClick={() => zoomByFactor(1 / 1.25)}
                disabled={atMin}
                title="Отдалить (−)"
                aria-label="Отдалить"
              >
                −
              </button>
              <span className="psy-diagram-fs-pct" aria-live="polite">
                {Math.round(v.scale * 100)}%
              </span>
              <button
                type="button"
                className="psy-diagram-fs-btn"
                onClick={() => zoomByFactor(1.25)}
                disabled={atMax}
                title="Приблизить (+)"
                aria-label="Приблизить"
              >
                +
              </button>
              <button
                type="button"
                className="psy-diagram-fs-btn"
                onClick={resetView}
                title="Вписать целиком (0)"
                aria-label="Вписать схему целиком"
              >
                ⟲
              </button>
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
