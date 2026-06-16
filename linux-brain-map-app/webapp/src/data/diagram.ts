// Модель схемы (диаграммы механизма) — L1.
// Вместо плоской цепочки шагов описываем настоящий граф: узлы разных
// типов, типизированные рёбра (последовательность / ветвление / петля /
// параллель) и опциональные дорожки (swimlanes) для слоёв (userspace / ядро /
// железо и т.п.). Раскладка вычисляется в lib/diagram-layout.ts, рисуется в
// components/DiagramView.tsx.

/** Тип узла — задаёт цвет/иконку и смысл. */
export type DiagramNodeKind =
  | 'start' // точка входа
  | 'process' // обычный шаг/действие
  | 'decision' // развилка по условию (из неё выходят branch-рёбра)
  | 'state' // состояние (для автоматов состояний, напр. процессы)
  | 'data' // структура данных / интерфейс (inode, runqueue, /proc)
  | 'resource' // железо / физический ресурс (CPU, диск, NIC, RAM)
  | 'danger' // плохой/терминальный исход (OOM, SIGSEGV, panic, kill)
  | 'end' // нормальное завершение

/** Тип ребра — задаёт стиль линии и маршрутизацию. */
export type DiagramEdgeKind =
  | 'seq' // обычный переход «дальше»
  | 'branch' // ветвление из decision; обычно с label-условием
  | 'loop' // обратное ребро / цикл (рисуется пунктиром, дугой назад)
  | 'parallel' // параллельная ветка (одновременно с другими)

export type DiagramNode = {
  id: string
  label: string
  /** Короткое пояснение узла (показывается под меткой / в title). */
  detail?: string
  /** По умолчанию 'process'. */
  kind?: DiagramNodeKind
  /** id дорожки из Diagram.lanes; если задан — узел кладётся в эту полосу. */
  lane?: string
}

export type DiagramEdge = {
  from: string
  to: string
  /** По умолчанию 'seq'. */
  kind?: DiagramEdgeKind
  /** Подпись на ребре: условие ветвления или триггер перехода. */
  label?: string
}

/** Дорожка (swimlane) — горизонтальная полоса-слой, сверху вниз. */
export type DiagramLane = {
  id: string
  label: string
}

export type Diagram = {
  /** Слои сверху вниз. Если заданы — узлы раскладываются по своим lane. */
  lanes?: DiagramLane[]
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}
