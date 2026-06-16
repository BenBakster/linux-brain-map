// Чистая, детерминированная раскладка схемы (без DOM-замеров и без граф-движка).
// Колонка узла = длиннейший путь по не-loop рёбрам (longest-path rank).
// Строка узла = индекс дорожки (если есть lanes) либо упаковка по колонке.
// Геометрия фиксированная → координаты узлов и SVG-пути рёбер считаются
// аналитически. Это тестируется юнит-тестами без браузера.

import type { Diagram, DiagramEdge, DiagramNode } from '@/data/diagram'

export const NODE_W = 172
export const NODE_H = 78
export const COL_GAP = 60
export const ROW_GAP = 40
export const PAD = 28
export const LANE_GUTTER = 104 // место слева под подписи дорожек
export const INTRA_GAP = 16 // зазор при стопке узлов в одной ячейке дорожки
const COL_PITCH = NODE_W + COL_GAP
const ROW_PITCH = NODE_H + ROW_GAP

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

export function layoutDiagram(diagram: Diagram): DiagramLayout {
  const nodes = diagram.nodes
  const edges = diagram.edges
  if (nodes.length === 0) {
    return { nodes: [], edges: [], lanes: [], width: PAD * 2, height: PAD * 2, hasLanes: false }
  }
  const colOf = computeColumns(nodes, edges)
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
    // Высота дорожки = максимальная стопка в ней.
    const laneMaxStack = lanes.map((_, li) => {
      let m = 1
      stacks.forEach((arr, key) => {
        if (key.startsWith(`${li}:`)) m = Math.max(m, arr.length)
      })
      return m
    })
    const laneHeight = laneMaxStack.map((m) => m * NODE_H + (m + 1) * INTRA_GAP)
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
      const x = xOf(c)
      const y = laneTop[li] + INTRA_GAP + k * (NODE_H + INTRA_GAP)
      positioned.push(node(n, c, x, y))
    })
  } else {
    // Без дорожек: упаковка по колонкам, колонки вертикально центрируются.
    const byCol = new Map<number, DiagramNode[]>()
    nodes.forEach((n) => {
      const c = colOf.get(n.id) ?? 0
      if (!byCol.has(c)) byCol.set(c, [])
      byCol.get(c)!.push(n)
    })
    const maxCount = Math.max(1, ...[...byCol.values()].map((a) => a.length))
    byCol.forEach((arr, c) => {
      const start = (maxCount - arr.length) / 2
      arr.forEach((n, i) => {
        const x = xOf(c)
        const y = PAD + (start + i) * ROW_PITCH
        positioned.push(node(n, c, x, y))
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

function node(n: DiagramNode, col: number, x: number, y: number): PositionedNode {
  return { ...n, col, x, y, w: NODE_W, h: NODE_H, cx: x + NODE_W / 2, cy: y + NODE_H / 2 }
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
