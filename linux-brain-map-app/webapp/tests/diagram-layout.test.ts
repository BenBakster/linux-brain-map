import { expect, test } from 'bun:test'

import type { Diagram } from '../src/data/diagram'
import {
  computeColumns,
  describeTransitions,
  estimateNodeHeight,
  layoutDiagram,
  MAX_NODE_H,
  MIN_NODE_H,
  NODE_W,
} from '../src/lib/diagram-layout'

test('линейная цепочка → колонки 0,1,2', () => {
  const nodes = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
  ]
  const col = computeColumns(nodes, edges)
  expect(col.get('a')).toBe(0)
  expect(col.get('b')).toBe(1)
  expect(col.get('c')).toBe(2)
})

test('ветвление: оба потомка decision уходят в следующую колонку', () => {
  const nodes = [
    { id: 'd', label: 'есть?', kind: 'decision' as const },
    { id: 'yes', label: 'да' },
    { id: 'no', label: 'нет' },
  ]
  const edges = [
    { from: 'd', to: 'yes', kind: 'branch' as const, label: 'да' },
    { from: 'd', to: 'no', kind: 'branch' as const, label: 'нет' },
  ]
  const col = computeColumns(nodes, edges)
  expect(col.get('d')).toBe(0)
  expect(col.get('yes')).toBe(1)
  expect(col.get('no')).toBe(1)
})

test('loop-ребро не учитывается в ранжировании колонок', () => {
  const nodes = [{ id: 'run', label: 'Running' }, { id: 'ready', label: 'Ready' }]
  const edges = [
    { from: 'ready', to: 'run' },
    { from: 'run', to: 'ready', kind: 'loop' as const, label: 'вытеснение' },
  ]
  const col = computeColumns(nodes, edges)
  expect(col.get('ready')).toBe(0)
  expect(col.get('run')).toBe(1)
})

test('длиннейший путь, а не первый: ромб сходится дальше всех', () => {
  // a -> b -> d  и a -> d : d должен встать в колонку 2 (длиннейший путь).
  const nodes = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'd', label: 'D' }]
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'd' },
    { from: 'a', to: 'd' },
  ]
  const col = computeColumns(nodes, edges)
  expect(col.get('d')).toBe(2)
})

test('дорожки: полосы по порядку, узлы получают y своей дорожки', () => {
  const diagram: Diagram = {
    lanes: [
      { id: 'user', label: 'userspace' },
      { id: 'kernel', label: 'ядро' },
      { id: 'hw', label: 'железо' },
    ],
    nodes: [
      { id: 'app', label: 'app', lane: 'user' },
      { id: 'sys', label: 'syscall', lane: 'kernel' },
      { id: 'cpu', label: 'CPU', lane: 'hw' },
    ],
    edges: [
      { from: 'app', to: 'sys' },
      { from: 'sys', to: 'cpu' },
    ],
  }
  const out = layoutDiagram(diagram)
  expect(out.hasLanes).toBe(true)
  expect(out.lanes).toHaveLength(3)
  // полосы идут сверху вниз
  expect(out.lanes[0].y).toBeLessThan(out.lanes[1].y)
  expect(out.lanes[1].y).toBeLessThan(out.lanes[2].y)
  const app = out.nodes.find((n) => n.id === 'app')!
  const cpu = out.nodes.find((n) => n.id === 'cpu')!
  // узел верхней дорожки выше узла нижней
  expect(app.y).toBeLessThan(cpu.y)
})

test('каждое валидное ребро получает SVG-путь; битые рёбра отбрасываются', () => {
  const diagram: Diagram = {
    nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'a', to: 'GHOST' }, // несуществующая цель
    ],
  }
  const out = layoutDiagram(diagram)
  expect(out.edges).toHaveLength(1)
  expect(out.edges[0].path.startsWith('M ')).toBe(true)
})

test('колонки сдвигают узлы вправо на шаг колонки', () => {
  const diagram: Diagram = {
    nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    edges: [{ from: 'a', to: 'b' }],
  }
  const out = layoutDiagram(diagram)
  const a = out.nodes.find((n) => n.id === 'a')!
  const b = out.nodes.find((n) => n.id === 'b')!
  expect(b.x).toBeGreaterThan(a.x + NODE_W)
  expect(out.width).toBeGreaterThan(b.x)
})

test('describeTransitions: проговаривает рёбра по типу и подписи, имена узлов вместо id', () => {
  const diagram: Diagram = {
    nodes: [
      { id: 'd', label: 'Развилка' },
      { id: 'y', label: 'Да-узел' },
      { id: 's', label: 'След.' },
      { id: 'p', label: 'Параллель' },
    ],
    edges: [
      { from: 'd', to: 'y', kind: 'branch', label: 'если да' },
      { from: 'y', to: 's', kind: 'seq' },
      { from: 's', to: 'd', kind: 'loop', label: 'назад' },
      { from: 'd', to: 'p', kind: 'parallel' },
      { from: 'd', to: 'GHOST', kind: 'seq' }, // битое ребро отбрасывается
    ],
  }
  const lines = describeTransitions(diagram)
  expect(lines).toEqual([
    'Развилка: при условии «если да» → Да-узел',
    'Да-узел: затем → След.',
    'След.: возврат (назад) → Развилка',
    'Развилка: параллельно → Параллель',
  ])
})

test('обратное ребро помечается isBack и рисуется дугой', () => {
  const diagram: Diagram = {
    nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'a', kind: 'loop' },
    ],
  }
  const out = layoutDiagram(diagram)
  const loop = out.edges.find((e) => e.from === 'b' && e.to === 'a')!
  expect(loop.isBack).toBe(true)
})

test('estimateNodeHeight: detail делает узел выше; высота в пределах [MIN, MAX]', () => {
  const bare = estimateNodeHeight({ id: 'x', label: 'X' })
  const withDetail = estimateNodeHeight({
    id: 'y',
    label: 'read() / open()',
    detail: 'Ядро отдаёт отрицательный код (-EACCES, -EFAULT, -ENOENT); это штатный путь ошибки.',
  })
  expect(bare).toBe(MIN_NODE_H) // короткий узел садится на пол
  expect(withDetail).toBeGreaterThan(bare)
  expect(withDetail).toBeGreaterThanOrEqual(MIN_NODE_H)
  expect(withDetail).toBeLessThanOrEqual(MAX_NODE_H)
  // монотонность: более длинный detail не делает узел ниже
  const longer = estimateNodeHeight({
    id: 'z',
    label: 'read() / open()',
    detail:
      'Ядро отдаёт отрицательный код (-EACCES, -EFAULT, -ENOENT); это штатный путь ошибки, который обработчик обязан проверить.',
  })
  expect(longer).toBeGreaterThanOrEqual(withDetail)
})

test('стопка узлов с длинным detail в одной дорожке не перекрывается по вертикали', () => {
  const longDetail =
    'Родитель клонирует себя: потомок получает НОВЫЙ PID и ту же память по copy-on-write.'
  const diagram: Diagram = {
    lanes: [{ id: 'k', label: 'ядро' }],
    nodes: [
      { id: 'a', label: 'fork', detail: longDetail, lane: 'k' },
      { id: 'b', label: 'exec', detail: longDetail, lane: 'k' },
    ],
    // loop не ранжирует колонки → оба узла в колонке 0 → стопка в одной ячейке
    edges: [{ from: 'a', to: 'b', kind: 'loop' }],
  }
  const out = layoutDiagram(diagram)
  const a = out.nodes.find((n) => n.id === 'a')!
  const b = out.nodes.find((n) => n.id === 'b')!
  expect(a.col).toBe(b.col)
  expect(a.h).toBeGreaterThan(MIN_NODE_H) // высота выросла под текст
  const [top, bottom] = a.y <= b.y ? [a, b] : [b, a]
  expect(bottom.y).toBeGreaterThanOrEqual(top.y + top.h) // нижний ниже верхнего целиком
})
