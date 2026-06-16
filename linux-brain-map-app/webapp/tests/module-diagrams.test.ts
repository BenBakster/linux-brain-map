import { expect, test } from 'bun:test'

import type { Diagram } from '../src/data/diagram'
import { MODULE_DIAGRAMS } from '../src/data/module-diagrams'
import { MODULES } from '../src/data/modules'
import { decisionsToDiagram } from '../src/components/DiagramView'
import { layoutDiagram, type PositionedNode } from '../src/lib/diagram-layout'

const chapters = MODULES.map((m) => m.number).sort((a, b) => a - b)

function boxesOverlap(a: PositionedNode, b: PositionedNode): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

function assertHealthy(diagram: Diagram, label: string) {
  // целостность данных
  const ids = diagram.nodes.map((n) => n.id)
  expect(new Set(ids).size, `${label}: id узлов уникальны`).toBe(ids.length)
  const idSet = new Set(ids)
  for (const e of diagram.edges) {
    expect(idSet.has(e.from), `${label}: ребро.from "${e.from}" существует`).toBe(true)
    expect(idSet.has(e.to), `${label}: ребро.to "${e.to}" существует`).toBe(true)
  }
  if (diagram.lanes) {
    const laneSet = new Set(diagram.lanes.map((l) => l.id))
    for (const n of diagram.nodes) {
      if (n.lane !== undefined) {
        expect(laneSet.has(n.lane), `${label}: узел "${n.id}" ссылается на существующую дорожку`).toBe(true)
      }
    }
  }
  // нет висячих узлов
  const touched = new Set<string>()
  diagram.edges.forEach((e) => {
    touched.add(e.from)
    touched.add(e.to)
  })
  for (const id of ids) {
    expect(touched.has(id), `${label}: узел "${id}" связан хотя бы одним ребром`).toBe(true)
  }

  // раскладка: ничего не теряется и ничего не накладывается
  const out = layoutDiagram(diagram)
  expect(out.edges.length, `${label}: все рёбра отрисованы`).toBe(diagram.edges.length)
  for (let i = 0; i < out.nodes.length; i++) {
    for (let j = i + 1; j < out.nodes.length; j++) {
      expect(
        boxesOverlap(out.nodes[i], out.nodes[j]),
        `${label}: узлы "${out.nodes[i].id}" и "${out.nodes[j].id}" не перекрываются`,
      ).toBe(false)
    }
  }
  expect(out.width).toBeGreaterThan(0)
  expect(out.height).toBeGreaterThan(0)
}

test('каждая глава имеет схему механизма', () => {
  for (const n of chapters) {
    expect(MODULE_DIAGRAMS[n], `глава ${n}: схема задана`).toBeDefined()
  }
})

for (const n of chapters) {
  test(`глава ${n}: схема механизма здорова`, () => {
    assertHealthy(MODULE_DIAGRAMS[n], `гл.${n} механизм`)
  })

  test(`глава ${n}: схема не плоская (есть ветвление/петля/слои)`, () => {
    const d = MODULE_DIAGRAMS[n]
    const hasTopology =
      Boolean(d.lanes && d.lanes.length > 0) ||
      d.edges.some((e) => e.kind === 'branch' || e.kind === 'loop' || e.kind === 'parallel')
    expect(hasTopology, `гл.${n}: использует настоящую топологию, а не линию`).toBe(true)
  })

  test(`глава ${n}: каждый узел снабжён detail`, () => {
    for (const node of MODULE_DIAGRAMS[n].nodes) {
      expect(Boolean(node.detail && node.detail.trim()), `гл.${n}: узел "${node.id}" имеет detail`).toBe(true)
    }
  })
}

test('адаптер дерева решений даёт здоровую схему для всех глав', () => {
  for (const mod of MODULES) {
    assertHealthy(decisionsToDiagram(mod.decisions), `гл.${mod.number} решения`)
  }
})
