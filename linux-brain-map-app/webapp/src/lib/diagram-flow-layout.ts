// ПРОТОТИП новой раскладки схем: WRAPPED SEQUENTIAL FLOW + LABEL-CHANNEL
// RESERVATION (WSF-LCR). Живёт ОТДЕЛЬНО от diagram-layout.ts, не меняя его.
//
// Идея («ментальная карта»):
//   • узлы выстраиваются СЛЕВА-НАПРАВО в порядке детерминированного step-index;
//   • у правого края контейнера ряд ПЕРЕНОСИТСЯ (как слова в абзаце);
//   • свимлейн-полос НЕТ — смысловой слой узла кодируется ЦВЕТОМ рамки + бейджем
//     (поле node.lane → layer-key; рендер раскрашивает по data-layer);
//   • рёбра ЛЮБОГО типа корректно «заворачивают» при переносе ряда;
//   • ГЛАВНОЕ: место под подпись ребра РЕЗЕРВИРУЕТСЯ в межрядовых каналах,
//     подписи разводятся так, что НЕ перекрываются ни с узлами, ни друг с другом.
//
// Чистая детерминированная функция (без DOM-замеров) — тестируема без браузера.
// Контракт результата (DiagramFlowLayout) намеренно совместим по полям с
// DiagramLayout из diagram-layout.ts (nodes/edges/lanes/width/height/hasLanes),
// плюс новые поля: node.step / node.rowIndex и edge.labelChannel / step_from /
// step_to — чтобы DiagramView мог потреблять обе раскладки одним рендером.

import type { Diagram, DiagramEdge, DiagramNode, DiagramEdgeKind } from '@/data/diagram'

// --- Геометрия узла (синхронно с .psy-dnode в index.css; те же значения, что в
// diagram-layout.ts, продублированы локально, чтобы модуль был автономен). ---
export const NODE_W = 200
export const COL_GAP = 40 // зазор между узлами внутри ряда (по горизонтали)
export const ROW_GAP = 28 // минимальный зазор между рядами, когда межрядовых рёбер нет
export const PAD = 20 // поля контейнера
export const INTRA_GAP = 8 // вертикальный отступ узла внутри полосы ряда
export const MIN_NODE_H = 88
export const MAX_NODE_H = 164

// Высота узла оценивается аналитически (как в diagram-layout.ts).
const PAD_X = 8
const PAD_Y = 5.6
const LINE_H = 1.12
const LABEL_PX = 16
const DATA_LABEL_PX = 14.72
const DETAIL_PX = 12.8
const DETAIL_MARGIN = 2.4
const K_LABEL = 0.6
const K_MONO = 0.62
const K_DETAIL = 0.55
const SLACK = 10

// --- Подпись ребра: плашка в один ряд высоты EDGE_LABEL_H. Ширина — аналитика
// из длины текста (как .psy-edge-label). ---
const EDGE_LABEL_PX = 11.84
const K_EDGE = 0.55
const EDGE_LABEL_PAD_X = 7
export const EDGE_LABEL_H = 20
const LABEL_GAP = 6 // минимальный зазор между подписями / подписью и узлом

// --- Каналы под подписи рёбер (резерв ВНЕ узлов). ---
// Высота полосы канала рассчитывается под число «этажей» подписей, см. ниже.
const CHANNEL_ROW_H = EDGE_LABEL_H + LABEL_GAP // высота одного «этажа» подписей в канале
const CHANNEL_MIN_H = 14 // минимальный канал, даже если подписей нет (для линий)
const SIDE_MARGIN = 56 // запас справа от ряда под «обходные» дуги (back/loop через ряды)

// --- ПРАВАЯ ВЕРТИКАЛЬНАЯ «МАГИСТРАЛЬ» для длинных рёбер. ---
// Длинные рёбра (через >=2 ряда вниз ЛИБО любой возврат вверх) не пытаются
// пролезть сквозь сетку, а уходят в вертикальные полосы ПРАВЕЕ всех узлов:
// из правого края источника → вправо до своей полосы → вертикально до уровня
// цели → влево в правый край цели. Линия целиком правее сетки ⇒ узлов не режет
// по построению. Каждой такой дуге — своя полоса (детерминированный порядок),
// поэтому вертикальные участки не накладываются друг на друга.
const HIGHWAY_BASE_GAP = 28 // зазор от самого правого узла (contentRight) до 1-й полосы
const HIGHWAY_LANE_GAP = 22 // шаг между соседними полосами магистрали
const HIGHWAY_CORNER = 8 // радиус скругления ортогональных углов магистрали

function edgeLabelWidth(label: string | undefined): number {
  if (!label) return 0
  return Math.ceil(label.length * EDGE_LABEL_PX * K_EDGE) + 2 * EDGE_LABEL_PAD_X
}

export function estimateNodeHeightFlow(n: DiagramNode): number {
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

// --- Слой узла → ключ (для цвета+бейджа в рендере). lane-id может быть любым,
// поэтому маппим по эвристике подстроки на 3 канонических слоя. ---
export type LayerKey = 'user' | 'kern' | 'hw' | 'other'

export function layerOf(node: DiagramNode): LayerKey {
  const raw = (node.lane ?? '').toLowerCase()
  if (/user|usr|app|процесс|задач|userspace|приклад/.test(raw)) return 'user'
  if (/kern|krn|ядро|policy|полит|vfs|cache|fsimpl|block|транспорт|примитив/.test(raw)) return 'kern'
  if (/hw|hardware|железо|phys|физ|nic|cpu|диск|память|ram|swap|io|хранил|носит/.test(raw)) return 'hw'
  if (raw) return 'other'
  // нет lane — раскрашиваем по kind (резерв)
  if (node.kind === 'resource') return 'hw'
  return 'other'
}

// --- Типы результата ---
export type PositionedFlowNode = DiagramNode & {
  step: number // детерминированный порядок раскрытия (0..N-1)
  rowIndex: number // в каком ряду стоит узел
  layer: LayerKey // слой для цвета+бейджа
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
}

export type RoutedFlowEdge = DiagramEdge & {
  path: string
  labelX: number
  labelY: number
  labelW: number
  labelH: number
  labelChannel: 'inline' | 'top' | 'bot' | 'side'
  isBack: boolean
  step_from: number
  step_to: number
}

export type LaidLane = { id: string; label: string; y: number; height: number }

export type DiagramFlowLayout = {
  nodes: PositionedFlowNode[]
  edges: RoutedFlowEdge[]
  lanes: LaidLane[] // всегда пусто: слой кодируется цветом узла, не полосой
  width: number
  height: number
  hasLanes: boolean // всегда false в этом движке
}

type Box = { x: number; y: number; w: number; h: number }

function boxesOverlapAABB(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

const EDGE_KIND_PRIORITY: Record<DiagramEdgeKind, number> = {
  seq: 0,
  branch: 1,
  parallel: 2,
  loop: 3,
}

/**
 * PHASE 1 — детерминированный step-index.
 * DFS от start-узла (или первого), соседи отсортированы по (kind, to-id), что
 * даёт стабильный порядок при фиксированном входе. Несвязные узлы добавляются в
 * хвост по (исходный индекс) — тоже детерминированно.
 */
export function computeSteps(diagram: Diagram): Map<string, number> {
  const { nodes, edges } = diagram
  if (nodes.length === 0) return new Map()
  const order = new Map(nodes.map((n, i) => [n.id, i]))
  const startNode = nodes.find((n) => n.kind === 'start') ?? nodes[0]
  const startId = startNode.id

  // Исходящие соседи каждого узла, отсортированные стабильно.
  const out = new Map<string, string[]>()
  for (const n of nodes) out.set(n.id, [])
  const sortedEdges = [...edges]
    .filter((e) => order.has(e.from) && order.has(e.to))
    .sort((a, b) => {
      const ka = EDGE_KIND_PRIORITY[a.kind ?? 'seq'] ?? 4
      const kb = EDGE_KIND_PRIORITY[b.kind ?? 'seq'] ?? 4
      if (ka !== kb) return ka - kb
      return (a.to ?? '').localeCompare(b.to ?? '')
    })
  for (const e of sortedEdges) out.get(e.from)!.push(e.to)

  const visited = new Set<string>()
  const stepOf = new Map<string, number>()
  let counter = 0
  // Итеративный DFS (стек) — без рекурсии, чтобы исключить переполнение и быть
  // явно детерминированным: соседей кладём в стек в обратном порядке, снимаем по
  // одному, посещаем первого непосещённого.
  const stack: string[] = [startId]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (visited.has(id)) continue
    visited.add(id)
    stepOf.set(id, counter++)
    const neighbors = out.get(id) ?? []
    for (let i = neighbors.length - 1; i >= 0; i--) {
      if (!visited.has(neighbors[i])) stack.push(neighbors[i])
    }
  }

  // Несвязные узлы — в порядке исходного массива (детерминировано).
  const rest = nodes
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  for (const n of rest) stepOf.set(n.id, counter++)

  return stepOf
}

type Row = {
  index: number
  nodeIds: string[]
  contentWidth: number // суммарная ширина узлов + COL_GAP между ними
  height: number // высота самого высокого узла ряда
  y: number // верх полосы ряда (узлы кладутся с отступом INTRA_GAP)
  topChannelH: number // высота канала НАД рядом
  botChannelH: number // высота канала ПОД рядом
}

/**
 * PHASE 2 — упаковка узлов в ряды по step-index с переносом по containerWidth.
 * Если ширина не задана → одна строка (Infinity).
 */
function wrapIntoRows(
  ordered: DiagramNode[],
  heightOf: (n: DiagramNode) => number,
  containerWidth: number | undefined,
): Row[] {
  const maxRowW =
    containerWidth !== undefined && containerWidth > 0
      ? Math.max(NODE_W, containerWidth - 2 * PAD - SIDE_MARGIN)
      : Infinity

  const rows: Row[] = []
  let cur: string[] = []
  let curW = 0
  let curH = 0
  const flush = () => {
    if (cur.length === 0) return
    rows.push({
      index: rows.length,
      nodeIds: cur,
      contentWidth: curW,
      height: Math.max(MIN_NODE_H, curH),
      y: 0,
      topChannelH: 0,
      botChannelH: 0,
    })
    cur = []
    curW = 0
    curH = 0
  }
  for (const n of ordered) {
    const add = NODE_W + (cur.length > 0 ? COL_GAP : 0)
    if (cur.length > 0 && curW + add > maxRowW) flush()
    cur.push(n.id)
    curW += cur.length > 1 ? NODE_W + COL_GAP : NODE_W
    curH = Math.max(curH, heightOf(n))
  }
  flush()
  return rows
}

/**
 * Сколько «этажей» подписей нужно зарезервировать в межрядовом канале.
 * Канал между рядом r и r+1 несёт подписи всех рёбер, чьи концы лежат в соседних
 * рядах (и пары — оценка сверху). Берём грубую, но безопасную оценку: число
 * подписей, делённое на вместимость канала по ширине, но не меньше 1, если есть
 * хоть одна подпись.
 */
function channelFloorsFor(labelsW: number[], rowWidth: number): number {
  if (labelsW.length === 0) return 0
  const cap = Math.max(NODE_W, rowWidth)
  let used = 0
  let floors = 1
  for (const w of labelsW.slice().sort((a, b) => b - a)) {
    if (used + w + LABEL_GAP > cap) {
      floors++
      used = w + LABEL_GAP
    } else {
      used += w + LABEL_GAP
    }
  }
  return floors
}

/**
 * PHASE 3+4 — вертикальная раскладка рядов с резервом каналов и горизонтальная
 * расстановка узлов внутри ряда (слева-направо, левое выравнивание).
 */
function placeRows(
  rows: Row[],
  ordered: DiagramNode[],
  edges: DiagramEdge[],
  rowOfNode: Map<string, number>,
  heightOf: (n: DiagramNode) => number,
  stepOf: Map<string, number>,
): PositionedFlowNode[] {
  // Ширина каждого ряда — для оценки вместимости каналов.
  const rowWidth = rows.map((r) => r.contentWidth)

  // Подписи рёбер, проходящих ПОД рядом i (из ряда i вниз) и НАД рядом i (в ряд i
  // сверху). Канал между i и i+1 разделяется на bot(i) и top(i+1); кладём
  // безопасно: ставим высоту канала = max(этажи bot(i), этажи top(i+1)).
  const labelsBelow: number[][] = rows.map(() => [])
  const labelsAbove: number[][] = rows.map(() => [])
  for (const e of edges) {
    const rf = rowOfNode.get(e.from)
    const rt = rowOfNode.get(e.to)
    if (rf === undefined || rt === undefined) continue
    if (rf === rt) continue
    const w = edgeLabelWidth(e.label)
    if (w === 0) continue
    const lo = Math.min(rf, rt)
    const hi = Math.max(rf, rt)
    // Подпись разместим в канале сразу под верхним из двух рядов.
    labelsBelow[lo].push(w)
    labelsAbove[hi].push(w)
  }

  // Высота каналов над/под каждым рядом.
  for (let i = 0; i < rows.length; i++) {
    const floorsBot = channelFloorsFor(labelsBelow[i], rowWidth[i])
    const floorsTop = channelFloorsFor(labelsAbove[i], rowWidth[i])
    rows[i].botChannelH = floorsBot > 0 ? floorsBot * CHANNEL_ROW_H + LABEL_GAP : CHANNEL_MIN_H
    rows[i].topChannelH = floorsTop > 0 ? floorsTop * CHANNEL_ROW_H + LABEL_GAP : CHANNEL_MIN_H
  }

  // Вертикальный курсор: PAD → [topChannel] ряд0 [botChannel/ = max(bot0,top1)] ряд1 ...
  let cursor = PAD
  for (let i = 0; i < rows.length; i++) {
    const topH = i === 0 ? CHANNEL_MIN_H : Math.max(rows[i].topChannelH, rows[i - 1].botChannelH, ROW_GAP / 2)
    cursor += topH
    rows[i].y = cursor
    cursor += rows[i].height + 2 * INTRA_GAP
    // botChannel учтётся как topH следующего ряда; для последнего — добавим тут.
    if (i === rows.length - 1) cursor += Math.max(rows[i].botChannelH, CHANNEL_MIN_H)
  }

  // Горизонтальная расстановка узлов в каждом ряду.
  const byId = new Map(ordered.map((n) => [n.id, n]))
  const positioned: PositionedFlowNode[] = []
  for (const row of rows) {
    let x = PAD
    for (const id of row.nodeIds) {
      const n = byId.get(id)!
      const h = heightOf(n)
      const y = row.y + INTRA_GAP + (row.height - h) / 2 // вертикально центрируем в полосе ряда
      positioned.push({
        ...n,
        step: stepOf.get(id) ?? 0,
        rowIndex: row.index,
        layer: layerOf(n),
        x,
        y,
        w: NODE_W,
        h,
        cx: x + NODE_W / 2,
        cy: y + h / 2,
      })
      x += NODE_W + COL_GAP
    }
  }
  return positioned
}

type Pt2 = { x: number; y: number }

// Ортогональная скруглённая ломаная по списку точек-перегибов. Каждый внутренний
// угол смягчается квадратичной Безье радиусом r (усечённым под длину обоих
// смежных плеч, чтобы не «вылезти» за соседние сегменты). Концы — как есть, что
// сохраняет корректное направление входа/выхода для markerEnd (orient="auto").
function roundedPolyline(pts: Pt2[], r: number): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const next = pts[i + 1]
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y)
    const rr = Math.min(r, inLen / 2, outLen / 2)
    if (rr < 0.5) {
      d += ` L ${cur.x} ${cur.y}`
      continue
    }
    const ax = cur.x - ((cur.x - prev.x) / inLen) * rr
    const ay = cur.y - ((cur.y - prev.y) / inLen) * rr
    const bx = cur.x + ((next.x - cur.x) / outLen) * rr
    const by = cur.y + ((next.y - cur.y) / outLen) * rr
    d += ` L ${ax} ${ay} Q ${cur.x} ${cur.y} ${bx} ${by}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

/**
 * Длинное ребро ⇒ ПРАВАЯ МАГИСТРАЛЬ. Линия целиком обходит сетку:
 *   источник выходит ВВЕРХ/ВНИЗ из своего ряда в межрядовый канал (там узлов
 *   нет) → горизонталь по каналу до полосы laneX → вертикаль по полосе (правее
 *   ВСЕХ узлов) до канала у ряда цели → горизонталь по каналу к колонке цели →
 *   короткий вертикальный «штырь» в ВЕРХ/НИЗ цели.
 * Так линия НИГДЕ не пересекает боксы узлов (ни соседей-по-ряду источника/цели,
 * ни промежуточные ряды). Вход в цель — вертикально (markerEnd orient="auto"
 * смотрит «в» узел). Подпись — на полосе (labelChannel 'side'); resolveLabels
 * доразведёт без перекрытий.
 *
 * escapeSrcY / escapeDstY — Y «беговых дорожек» в каналах у источника/цели
 * (гарантированно вне полос узлов); их считает вызывающий по геометрии рядов.
 */
function routeHighway(
  a: PositionedFlowNode,
  b: PositionedFlowNode,
  laneX: number,
  escapeSrcY: number,
  escapeDstY: number,
): { path: string; labelX: number; labelY: number } {
  const sx = a.cx // выходим из ВЕРХА/НИЗА источника (вертикально, мимо соседей)
  const ex = b.cx // входим в ВЕРХ/НИЗ цели (вертикально, мимо соседей)
  const down = b.rowIndex > a.rowIndex
  const sy = down ? a.y + a.h : a.y // низ источника, если цель ниже; иначе верх
  const ey = down ? b.y : b.y + b.h // верх цели, если она ниже; иначе низ
  const pts: Pt2[] = [
    { x: sx, y: sy }, // старт у источника
    { x: sx, y: escapeSrcY }, // выход в канал источника (вертикально)
    { x: laneX, y: escapeSrcY }, // горизонталь по каналу до полосы
    { x: laneX, y: escapeDstY }, // вертикаль по полосе до канала у цели
    { x: ex, y: escapeDstY }, // горизонталь по каналу к колонке цели
    { x: ex, y: ey }, // штырь в цель (вертикально)
  ]
  return { path: roundedPolyline(pts, HIGHWAY_CORNER), labelX: laneX, labelY: (escapeSrcY + escapeDstY) / 2 }
}

/**
 * PHASE 5 — маршрутизация рёбер + первичный выбор позиции подписи.
 * Классификация:
 *   • intra-row (один ряд): forward S-кривая (соседние колонки) / forward-дуга
 *     снизу (через колонки, чтобы не резать промежуточные узлы) / back-arc /
 *     self-loop;
 *   • inter-row вниз на 1 ряд: заворот через межрядовый канал (для широкого
 *     горизонтального переноса — ортогонально по каналу, чтобы не клипать узлы);
 *   • inter-row на >=2 ряда вниз ЛИБО любой возврат вверх ⇒ ПРАВАЯ МАГИСТРАЛЬ.
 * Подпись ставится В КАНАЛ / НА ПОЛОСУ (вне узлов) — точную позицию доводит PHASE 6.
 */
function routeEdges(
  edges: DiagramEdge[],
  byId: Map<string, PositionedFlowNode>,
  rows: Row[],
  contentRight: number,
): RoutedFlowEdge[] {
  // --- Проход 1: распределяем «длинные» рёбра по полосам магистрали. ---
  // Длинное = inter-row на >=2 ряда (вниз) ЛИБО любой возврат ВВЕРХ (разные ряды).
  const isHighway = (a: PositionedFlowNode, b: PositionedFlowNode): boolean => {
    if (a.rowIndex === b.rowIndex) return false
    const dr = b.rowIndex - a.rowIndex
    return dr <= -1 || dr >= 2
  }
  const longEdges = edges
    .map((e) => ({ e, a: byId.get(e.from), b: byId.get(e.to) }))
    .filter((r): r is { e: DiagramEdge; a: PositionedFlowNode; b: PositionedFlowNode } => !!r.a && !!r.b && isHighway(r.a, r.b))
    // Детерминированный порядок полос: по step_from, затем step_to.
    .sort((x, y) => x.a.step - y.a.step || x.b.step - y.b.step)
  const laneOf = new Map<DiagramEdge, number>()
  longEdges.forEach((r, idx) => laneOf.set(r.e, idx))
  const laneX = (idx: number) => contentRight + HIGHWAY_BASE_GAP + idx * HIGHWAY_LANE_GAP

  // Полоса ряда: [rows[i].y, rows[i].y + 2*INTRA_GAP + height]. Узлы лежат СТРОГО
  // внутри (центрированы по height с отступом INTRA_GAP), поэтому Y чуть выше
  // верха / ниже низа полосы заведомо вне любого узла этого ряда — там и кладём
  // «беговые дорожки» магистрали в межрядовых каналах.
  const HIGHWAY_RUNWAY = 6
  const escapeAbove = (rowIndex: number) => rows[rowIndex].y - HIGHWAY_RUNWAY
  const escapeBelow = (rowIndex: number) => rows[rowIndex].y + 2 * INTRA_GAP + rows[rowIndex].height + HIGHWAY_RUNWAY

  const routed: RoutedFlowEdge[] = []
  for (const e of edges) {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    if (!a || !b) continue

    const isBack = b.step < a.step
    const labelW = edgeLabelWidth(e.label)
    const labelH = EDGE_LABEL_H
    let path: string
    let labelX: number
    let labelY: number
    let labelChannel: RoutedFlowEdge['labelChannel']

    const laneIdx = laneOf.get(e)
    if (laneIdx !== undefined) {
      // --- ПРАВАЯ МАГИСТРАЛЬ (длинное ребро: >=2 ряда вниз / любой возврат вверх) ---
      const down = b.rowIndex > a.rowIndex
      // Источник выходит в канал СО СТОРОНЫ движения (вниз→ниже, вверх→выше),
      // цель принимает штырь с противоположной стороны.
      const escapeSrcY = down ? escapeBelow(a.rowIndex) : escapeAbove(a.rowIndex)
      const escapeDstY = down ? escapeAbove(b.rowIndex) : escapeBelow(b.rowIndex)
      const r = routeHighway(a, b, laneX(laneIdx), escapeSrcY, escapeDstY)
      path = r.path
      labelX = r.labelX
      labelY = r.labelY
      labelChannel = 'side'
    } else if (a.rowIndex === b.rowIndex) {
      // --- Один ряд ---
      const selfLoop = a.id === b.id
      const cols = rows[a.rowIndex].nodeIds
      const colDist = Math.abs(cols.indexOf(a.id) - cols.indexOf(b.id))
      if (selfLoop) {
        // Петля на себя: маленькая дуга снизу.
        const sx = a.cx - 12
        const ex = a.cx + 12
        const sy = a.y + a.h
        const dip = sy + Math.max(28, rows[a.rowIndex].botChannelH * 0.6)
        path = `M ${sx} ${sy} C ${sx} ${dip}, ${ex} ${dip}, ${ex} ${sy}`
        labelX = a.cx
        labelY = dip
        labelChannel = 'bot'
      } else if (isBack || e.kind === 'loop') {
        // Возврат назад в том же ряду: дуга снизу (в канале под рядом).
        const sx = a.cx
        const ex = b.cx
        const sy = a.y + a.h
        const ey = b.y + b.h
        const dip = Math.max(sy, ey) + Math.max(24, rows[a.rowIndex].botChannelH * 0.5)
        path = `M ${sx} ${sy} C ${sx} ${dip}, ${ex} ${dip}, ${ex} ${ey}`
        labelX = (sx + ex) / 2
        labelY = dip
        labelChannel = 'bot'
      } else if (colDist >= 2) {
        // Вперёд по ряду ЧЕРЕЗ колонки: прямая S-кривая прорезала бы
        // промежуточные узлы → ведём дугой снизу (в канале под рядом),
        // вход в цель — снизу (markerEnd смотрит вверх «в» узел). Глубина дуги
        // обязана опуститься НИЖЕ самого низкого узла ряда (escapeBelow),
        // иначе высокий сосед между колонками (как gl2 «degraded») будет задет.
        const sx = a.cx
        const ex = b.cx
        const sy = a.y + a.h
        const ey = b.y + b.h
        const dip = Math.max(sy + 20, ey + 20, escapeBelow(a.rowIndex))
        path = `M ${sx} ${sy} C ${sx} ${dip}, ${ex} ${dip}, ${ex} ${ey}`
        labelX = (sx + ex) / 2
        labelY = dip
        labelChannel = 'bot'
      } else {
        // Соседние колонки: S-кривая между правым краем a и левым краем b.
        const sx = a.x + a.w
        const sy = a.cy
        const ex = b.x
        const ey = b.cy
        const dx = Math.max(16, Math.min((ex - sx) / 2, ex - sx - 16))
        path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`
        labelX = (sx + ex) / 2
        labelY = (sy + ey) / 2
        labelChannel = 'inline'
      }
    } else {
      // --- Заворот ВНИЗ на 1 ряд (b.rowIndex - a.rowIndex === 1) ---
      const sx = a.cx
      const sy = a.y + a.h
      const ex = b.cx
      const ey = b.y
      // Канал между рядом источника и рядом цели: от низа верхнего ряда до верха
      // нижнего. Точка перегиба — в его середине.
      const channelY = (sy + ey) / 2
      // При БОЛЬШОМ горизонтальном переносе (перенос «хвост ряда → начало
      // следующего») свободная диагональ клипает узлы нижнего ряда → ведём
      // ОРТОГОНАЛЬНО: вниз в канал, горизонталь СТРОГО ВЫШЕ всех верхов нижнего
      // ряда (escapeAbove — иначе высокий узел-сосед цели задевается), затем
      // вниз в верх цели.
      if (Math.abs(ex - sx) > NODE_W) {
        const runY = Math.min(channelY, escapeAbove(b.rowIndex))
        path = roundedPolyline(
          [
            { x: sx, y: sy },
            { x: sx, y: runY }, // вниз в канал
            { x: ex, y: runY }, // горизонталь по каналу (выше верхов нижнего ряда)
            { x: ex, y: ey }, // вниз в верх цели
          ],
          HIGHWAY_CORNER,
        )
        labelX = (sx + ex) / 2
        labelY = runY
      } else {
        path = `M ${sx} ${sy} C ${sx} ${channelY}, ${ex} ${channelY}, ${ex} ${ey}`
        labelX = (sx + ex) / 2
        labelY = channelY
      }
      labelChannel = 'inline'
    }

    routed.push({
      ...e,
      path,
      labelX,
      labelY,
      labelW,
      labelH,
      labelChannel,
      isBack,
      step_from: a.step,
      step_to: b.step,
    })
  }
  return routed
}

/**
 * PHASE 6 — РАЗВОДКА ПОДПИСЕЙ до отсутствия перекрытий (ядро требования).
 * Жадно, в детерминированном порядке (по step_from, затем step_to): для каждой
 * подписи ищем ближайшую к её «родной» позиции точку, где её бокс не пересекает
 * ни один узел, ни одну уже размещённую подпись. Поиск — спираль по сетке
 * (вверх/вниз и вбок шагами), гарантированно находит свободное место, т.к.
 * каналы зарезервированы и плоскость не ограничена снизу/по бокам.
 */
function resolveLabels(edges: RoutedFlowEdge[], nodes: PositionedFlowNode[]): void {
  const labeled = edges
    .filter((e) => e.label && e.labelW > 0)
    .sort((a, b) => a.step_from - b.step_from || a.step_to - b.step_to)

  const nodeBoxes: Box[] = nodes.map((n) => ({
    x: n.x - LABEL_GAP,
    y: n.y - LABEL_GAP,
    w: n.w + 2 * LABEL_GAP,
    h: n.h + 2 * LABEL_GAP,
  }))
  const placed: Box[] = []

  const boxAt = (e: RoutedFlowEdge, cx: number, cy: number): Box => ({
    x: cx - e.labelW / 2,
    y: cy - e.labelH / 2,
    w: e.labelW,
    h: e.labelH,
  })
  const collides = (box: Box): boolean => {
    for (const nb of nodeBoxes) if (boxesOverlapAABB(box, nb)) return true
    for (const pb of placed) if (boxesOverlapAABB(box, pb)) return true
    return false
  }

  const STEP_Y = EDGE_LABEL_H + LABEL_GAP
  const STEP_X = 18
  // Минимальный отступ подписи от левого/верхнего края холста: measureSize растит
  // полотно только вправо/вниз, поэтому уход подписи в минус по X/Y = клип.
  const EDGE_MARGIN = LABEL_GAP
  for (const e of labeled) {
    const x0 = e.labelX
    const y0 = e.labelY
    // Спираль: r — «кольцо» удаления. На каждом кольце пробуем сдвиги по Y
    // (предпочтительно — подпись остаётся ближе к линии) и по X.
    let found = false
    outer: for (let r = 0; r < 64; r++) {
      // кандидаты в порядке предпочтения: сначала вертикальные сдвиги (вниз/вверх),
      // затем диагональ/горизонталь — так подпись остаётся над/под своей линией.
      const dy = r * STEP_Y
      const dx = r * STEP_X
      const candidates: Array<[number, number]> =
        r === 0
          ? [[x0, y0]]
          : [
              [x0, y0 + dy],
              [x0, y0 - dy],
              [x0 + dx, y0 + dy],
              [x0 - dx, y0 + dy],
              [x0 + dx, y0 - dy],
              [x0 - dx, y0 - dy],
              [x0 + dx, y0],
              [x0 - dx, y0],
            ]
      for (const [cx, cy] of candidates) {
        const box = boxAt(e, cx, cy)
        // не выпускаем подпись за левый/верхний край (там клип не компенсируется);
        // вниз/вправо плоскость открыта — валидная точка всё равно найдётся.
        if (box.x < EDGE_MARGIN || box.y < EDGE_MARGIN) continue
        if (!collides(box)) {
          e.labelX = cx
          e.labelY = cy
          placed.push(box)
          found = true
          break outer
        }
      }
    }
    if (!found) {
      // Теоретически недостижимо при 64 кольцах; на всякий случай резервируем
      // место строго ниже всех (детерминированный хвост), чтобы инвариант держался.
      const cx = Math.max(x0, EDGE_MARGIN + e.labelW / 2)
      let cy = Math.max(y0, EDGE_MARGIN + e.labelH / 2)
      let box = boxAt(e, cx, cy)
      while (collides(box)) {
        cy += STEP_Y
        box = boxAt(e, cx, cy)
      }
      e.labelX = cx
      e.labelY = cy
      placed.push(box)
    }
  }
}

// Габариты пути ребра по его d-строке. Перебираем числа парами (x,y); координаты
// всех команд (M/L/C/Q) — абсолютные пары, поэтому крайние x/y кривой не выходят
// за крайние x/y её опорных точек (свойство выпуклой оболочки Безье). Этого
// достаточно для расчёта полотна: вертикальные полосы магистрали (даже у рёбер
// БЕЗ подписи) и нижние дуги учитываются здесь же.
function pathExtent(d: string): { maxX: number; maxY: number } {
  const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)
  let maxX = -Infinity
  let maxY = -Infinity
  if (nums) {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = parseFloat(nums[i])
      const y = parseFloat(nums[i + 1])
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return { maxX, maxY }
}

/** PHASE 7 — размер контейнера: учитываем узлы, линии рёбер И подписи (после разводки). */
function measureSize(
  nodes: PositionedFlowNode[],
  edges: RoutedFlowEdge[],
): { width: number; height: number } {
  let maxRight = PAD * 2
  let maxBottom = PAD * 2
  for (const n of nodes) {
    maxRight = Math.max(maxRight, n.x + n.w + PAD)
    maxBottom = Math.max(maxBottom, n.y + n.h + PAD)
  }
  for (const e of edges) {
    // 1) сама ЛИНИЯ ребра (важно для безымянных магистральных полос справа и
    //    нижних дуг — иначе клип у правого/нижнего края).
    const ext = pathExtent(e.path)
    if (Number.isFinite(ext.maxX)) maxRight = Math.max(maxRight, ext.maxX + PAD)
    if (Number.isFinite(ext.maxY)) maxBottom = Math.max(maxBottom, ext.maxY + PAD)
    // 2) плашка подписи (могла быть разведена дальше линии).
    if (!e.label || e.labelW === 0) continue
    maxRight = Math.max(maxRight, e.labelX + e.labelW / 2 + PAD)
    maxBottom = Math.max(maxBottom, e.labelY + e.labelH / 2 + PAD)
  }
  return { width: Math.ceil(maxRight), height: Math.ceil(maxBottom) }
}

/** Главная функция нового движка. */
export function layoutDiagramFlow(diagram: Diagram, containerWidth?: number): DiagramFlowLayout {
  const { nodes, edges } = diagram
  if (nodes.length === 0) {
    return { nodes: [], edges: [], lanes: [], width: PAD * 2, height: PAD * 2, hasLanes: false }
  }

  const stepOf = computeSteps(diagram)
  const ordered = [...nodes].sort((a, b) => (stepOf.get(a.id) ?? 0) - (stepOf.get(b.id) ?? 0))
  const hOf = new Map(nodes.map((n) => [n.id, estimateNodeHeightFlow(n)]))
  const heightOf = (n: DiagramNode) => hOf.get(n.id) ?? MIN_NODE_H

  const rows = wrapIntoRows(ordered, heightOf, containerWidth)
  const rowOfNode = new Map<string, number>()
  rows.forEach((r) => r.nodeIds.forEach((id) => rowOfNode.set(id, r.index)))

  const positioned = placeRows(rows, ordered, edges, rowOfNode, heightOf, stepOf)
  const byId = new Map(positioned.map((p) => [p.id, p]))

  const validEdges = edges.filter((e) => {
    const ok = byId.has(e.from) && byId.has(e.to)
    if (!ok && typeof console !== 'undefined') {
      console.warn(`[diagram-flow] ребро пропущено — нет узла: ${e.from} → ${e.to}`)
    }
    return ok
  })

  // contentRight = правый край самого правого узла; левее него лежит вся сетка,
  // правее — полосы магистрали (см. routeHighway).
  const contentRight = positioned.reduce((m, n) => Math.max(m, n.x + n.w), PAD)
  const routed = routeEdges(validEdges, byId, rows, contentRight)
  resolveLabels(routed, positioned)

  const { width, height } = measureSize(positioned, routed)
  return { nodes: positioned, edges: routed, lanes: [], width, height, hasLanes: false }
}
