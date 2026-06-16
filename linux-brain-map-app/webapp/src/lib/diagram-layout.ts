// Чистая, детерминированная раскладка схемы (без DOM-замеров и без граф-движка).
// Колонка узла = длиннейший путь по не-loop рёбрам (longest-path rank).
// Строка узла = индекс дорожки (если есть lanes) либо упаковка по колонке.
// Геометрия фиксированная → координаты узлов и SVG-пути рёбер считаются
// аналитически. Это тестируется юнит-тестами без браузера.

import type { Diagram, DiagramEdge, DiagramNode } from '@/data/diagram'

export const NODE_W = 184
export const COL_GAP = 60
export const ROW_GAP = 40
export const PAD = 28
export const LANE_GUTTER = 104 // место слева под подписи дорожек
export const INTRA_GAP = 16 // зазор при стопке узлов в одной ячейке дорожки
export const MIN_NODE_H = 76 // пол высоты узла: короткие узлы остаются «коробкой»
export const MAX_NODE_H = 132 // потолок: антибомба на гигантский detail
const COL_PITCH = NODE_W + COL_GAP

// Аналитическая оценка высоты узла под его текст — без DOM-замеров, чтобы
// раскладка оставалась чистой и юнит-тестируемой. Значения в px при корневом
// font-size 16px и ДОЛЖНЫ соответствовать размерам шрифта в index.css
// (.psy-dnode-label / .psy-dnode-detail). Биас намеренно вверх: лучше
// переоценить высоту (лишний воздух), чем недооценить и обрезать текст.
const PAD_X = 8 // padding-inline узла (0.5rem)
const PAD_Y = 5.6 // padding-block узла (0.35rem)
const LINE_H = 1.12 // line-height текстов узла
const LABEL_PX = 14.4 // .psy-dnode-label (0.9rem)
const DATA_LABEL_PX = 13.12 // моноширинная метка data-узла (0.82rem)
const DETAIL_PX = 11.52 // .psy-dnode-detail (0.72rem)
const DETAIL_MARGIN = 2.4 // margin-top detail (0.15rem)
const K_LABEL = 0.6 // средняя ширина глифа / кегль (кириллица, пропорциональный)
const K_MONO = 0.62 // то же для моноширинной метки data-узла
const K_DETAIL = 0.55 // то же для detail
const SLACK = 8 // запас на округления оценки

export type PositionedNode = DiagramNode & {
  col: number
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
}

export type RoutedEdge = DiagramEdge & {
  path: string
  labelX: number
  labelY: number
  isBack: boolean
}

export type LaidLane = { id: string; label: string; y: number; height: number }

export type DiagramLayout = {
  nodes: PositionedNode[]
  edges: RoutedEdge[]
  lanes: LaidLane[]
  width: number
  height: number
  hasLanes: boolean
}

/** Колонка каждого узла = длиннейший путь по не-loop рёбрам. */
export function computeColumns(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, number> {
  const col = new Map<string, number>()
  nodes.forEach((n) => col.set(n.id, 0))
  const forward = edges.filter((e) => e.kind !== 'loop' && col.has(e.from) && col.has(e.to))
  // Релаксация (longest path). Капим числом узлов — защита от случайного цикла.
  for (let iter = 0; iter < nodes.length + 1; iter++) {
    let changed = false
    for (const e of forward) {
      const want = (col.get(e.from) ?? 0) + 1
      if (want > (col.get(e.to) ?? 0)) {
        col.set(e.to, want)
        changed = true
      }
    }
    if (!changed) break
  }
  return col
}

/**
 * Высота узла под его текст (label + опциональный detail). Чистая аналитика:
 * длина строки → число строк по средней ширине глифа → пиксели. Без DOM, без
 * шрифтовых замеров — детерминирована и тестируема. Зажата в [MIN, MAX], где
 * MAX страхует от аномально длинного detail (его хвост дочистит overflow:hidden
 * в CSS, а полный текст всегда доступен в title-тултипе).
 */
export function estimateNodeHeight(n: DiagramNode): number {
  const innerW = NODE_W - 2 * PAD_X
  const isData = n.kind === 'data'
  const labelPx = isData ? DATA_LABEL_PX : LABEL_PX
  const labelCharW = labelPx * (isData ? K_MONO : K_LABEL)
  const cplLabel = Math.max(1, Math.floor(innerW / labelCharW))
  const labelLines = Math.max(1, Math.ceil(n.label.length / cplLabel))
  let h = labelLines * Math.ceil(labelPx * LINE_H)

  const detail = n.detail?.trim()
  if (detail) {
    const cplDetail = Math.max(1, Math.floor(innerW / (DETAIL_PX * K_DETAIL)))
    const detailLines = Math.ceil(detail.length / cplDetail)
    h += DETAIL_MARGIN + detailLines * Math.ceil(DETAIL_PX * LINE_H)
  }

  h += 2 * PAD_Y + SLACK
  return Math.max(MIN_NODE_H, Math.min(MAX_NODE_H, Math.round(h)))
}

export function layoutDiagram(diagram: Diagram): DiagramLayout {
  const nodes = diagram.nodes
  const edges = diagram.edges
  if (nodes.length === 0) {
    return { nodes: [], edges: [], lanes: [], width: PAD * 2, height: PAD * 2, hasLanes: false }
  }
  const colOf = computeColumns(nodes, edges)
  // Высота каждого узла под его текст (одна оценка на узел, переиспользуется).
  const hOf = new Map(nodes.map((n) => [n.id, estimateNodeHeight(n)]))
  const heightOf = (n: DiagramNode) => hOf.get(n.id) ?? MIN_NODE_H
  const hasLanes = Boolean(diagram.lanes && diagram.lanes.length > 0)
  const leftGutter = hasLanes ? LANE_GUTTER : PAD

  const xOf = (col: number) => leftGutter + col * COL_PITCH
  const positioned: PositionedNode[] = []
  const laidLanes: LaidLane[] = []

  if (hasLanes) {
    const lanes = diagram.lanes!
    const laneIndex = new Map(lanes.map((l, i) => [l.id, i]))
    // Для каждой дорожки и колонки — стопка узлов (обычно 1).
    const stacks = new Map<string, DiagramNode[]>() // key `${laneIdx}:${col}`
    nodes.forEach((n) => {
      const li = laneIndex.get(n.lane ?? '') ?? 0
      const c = colOf.get(n.id) ?? 0
      const key = `${li}:${c}`
      if (!stacks.has(key)) stacks.set(key, [])
      stacks.get(key)!.push(n)
    })
    // Высота стопки = верхний зазор + Σ(высота узла + зазор).
    const stackHeight = (arr: DiagramNode[]) =>
      INTRA_GAP + arr.reduce((s, m) => s + heightOf(m) + INTRA_GAP, 0)
    // Высота дорожки = самая высокая стопка среди её колонок.
    const laneHeight = lanes.map((_, li) => {
      let m = MIN_NODE_H + 2 * INTRA_GAP
      stacks.forEach((arr, key) => {
        if (key.startsWith(`${li}:`)) m = Math.max(m, stackHeight(arr))
      })
      return m
    })
    const laneTop: number[] = []
    let cursor = PAD
    lanes.forEach((l, li) => {
      laneTop[li] = cursor
      laidLanes.push({ id: l.id, label: l.label, y: cursor, height: laneHeight[li] })
      cursor += laneHeight[li]
    })
    nodes.forEach((n) => {
      const li = laneIndex.get(n.lane ?? '') ?? 0
      const c = colOf.get(n.id) ?? 0
      const stack = stacks.get(`${li}:${c}`)!
      // id узлов уникальны (проверяется тестом), поэтому findIndex находит сам n.
      const k = Math.max(0, stack.findIndex((m) => m.id === n.id))
      // y = верх дорожки + зазор + накопленные высоты предыдущих в стопке.
      let y = laneTop[li] + INTRA_GAP
      for (let j = 0; j < k; j++) y += heightOf(stack[j]) + INTRA_GAP
      positioned.push(node(n, c, xOf(c), y, heightOf(n)))
    })
  } else {
    // Без дорожек: упаковка по колонкам, колонки вертикально центрируются.
    const byCol = new Map<number, DiagramNode[]>()
    nodes.forEach((n) => {
      const c = colOf.get(n.id) ?? 0
      if (!byCol.has(c)) byCol.set(c, [])
      byCol.get(c)!.push(n)
    })
    const colHeight = (arr: DiagramNode[]) =>
      arr.reduce((s, m) => s + heightOf(m), 0) + ROW_GAP * Math.max(0, arr.length - 1)
    const maxColHeight = Math.max(MIN_NODE_H, ...[...byCol.values()].map(colHeight))
    byCol.forEach((arr, c) => {
      let y = PAD + (maxColHeight - colHeight(arr)) / 2
      arr.forEach((n) => {
        const h = heightOf(n)
        positioned.push(node(n, c, xOf(c), y, h))
        y += h + ROW_GAP
      })
    })
  }

  const byId = new Map(positioned.map((p) => [p.id, p]))
  const routed: RoutedEdge[] = edges
    .filter((e) => {
      const ok = byId.has(e.from) && byId.has(e.to)
      if (!ok && typeof console !== 'undefined') {
        console.warn(`[diagram] ребро пропущено — нет узла: ${e.from} → ${e.to}`)
      }
      return ok
    })
    .map((e) => routeEdge(e, byId.get(e.from)!, byId.get(e.to)!))

  const width = Math.max(PAD * 2, ...positioned.map((p) => p.x + p.w + PAD))
  const height = Math.max(
    PAD * 2,
    ...positioned.map((p) => p.y + p.h + PAD),
    ...laidLanes.map((l) => l.y + l.height + PAD),
    ...routed.map((r) => r.labelY + PAD),
  )

  return { nodes: positioned, edges: routed, lanes: laidLanes, width, height, hasLanes }
}

function node(n: DiagramNode, col: number, x: number, y: number, h: number): PositionedNode {
  return { ...n, col, x, y, w: NODE_W, h, cx: x + NODE_W / 2, cy: y + h / 2 }
}

function routeEdge(e: DiagramEdge, a: PositionedNode, b: PositionedNode): RoutedEdge {
  const back = b.col < a.col
  const sameCol = b.col === a.col
  let path: string
  let labelX: number
  let labelY: number

  if (back || (sameCol && e.kind === 'loop')) {
    // Обратное ребро/петля: дуга в сторону движения — вверх, если цель выше,
    // иначе вниз. Так петля не тянется через весь столбец узлов.
    // Вверх — только если есть запас сверху (контейнер обрезает overflow-y),
    // иначе уводим дугу вниз: так петля никогда не обрежется.
    const goesUp = b.cy < a.cy - 1 && Math.min(a.y, b.y) >= 50
    const sx = a.cx
    const ex = b.cx
    if (goesUp) {
      const sy = a.y
      const ey = b.y
      const peak = Math.min(sy, ey) - 46
      path = `M ${sx} ${sy} C ${sx} ${peak}, ${ex} ${peak}, ${ex} ${ey}`
      labelX = (sx + ex) / 2
      labelY = peak - 4
    } else {
      const sy = a.y + a.h
      const ey = b.y + b.h
      const dip = Math.max(sy, ey) + 46
      path = `M ${sx} ${sy} C ${sx} ${dip}, ${ex} ${dip}, ${ex} ${ey}`
      labelX = (sx + ex) / 2
      labelY = dip + 4
    }
  } else if (sameCol) {
    // Тот же столбец, разные строки: вертикальная связь.
    const down = b.cy > a.cy
    const sx = a.cx
    const sy = down ? a.y + a.h : a.y
    const ex = b.cx
    const ey = down ? b.y : b.y + b.h
    const my = (sy + ey) / 2
    path = `M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`
    labelX = (sx + ex) / 2
    labelY = my - 6
  } else {
    // Прямое ребро: правый край источника → левый край цели (S-кривая).
    const sx = a.x + a.w
    const sy = a.cy
    const ex = b.x
    const ey = b.cy
    // Зажимаем смещение управляющих точек, чтобы при малом зазоре кривая
    // не выворачивалась назад сквозь узлы.
    const dx = Math.max(24, Math.min((ex - sx) / 2, ex - sx - 24))
    path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`
    labelX = (sx + ex) / 2
    labelY = (sy + ey) / 2 - 8
  }

  return { ...e, path, labelX, labelY, isBack: back }
}

/**
 * Текстовая альтернатива для скринридеров: переходы схемы словами.
 * SVG со стрелками и подписями условий декоративен (aria-hidden), поэтому
 * условия ветвлений иначе до AT не доходят. Здесь каждое ребро проговаривается
 * «откуда: связь → куда» с учётом типа (ветвление / возврат / параллель).
 * Чистая функция — тестируется без DOM.
 */
export function describeTransitions(diagram: Diagram): string[] {
  const labelOf = new Map(diagram.nodes.map((n) => [n.id, n.label]))
  return diagram.edges
    .filter((e) => labelOf.has(e.from) && labelOf.has(e.to))
    .map((e) => {
      const from = labelOf.get(e.from)!
      const to = labelOf.get(e.to)!
      const kind = e.kind ?? 'seq'
      const cond = e.label?.trim()
      let link: string
      if (kind === 'branch') link = cond ? `при условии «${cond}»` : 'ветвление'
      else if (kind === 'loop') link = cond ? `возврат (${cond})` : 'возврат'
      else if (kind === 'parallel') link = cond ? `параллельно (${cond})` : 'параллельно'
      else link = cond ? cond : 'затем'
      return `${from}: ${link} → ${to}`
    })
}
