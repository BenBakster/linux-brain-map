import { expect, test } from 'bun:test'

import { MODULES } from '../src/data/modules'
import { MODULE_DIAGRAMS } from '../src/data/module-diagrams'
import { layoutDiagramFlow } from '../src/lib/diagram-flow-layout'

// Регрессионный сторож движка wrapped-flow (diagram-flow-layout.ts). Главная
// гарантия фичи: на всех схемах и при любой ширине контейнера —
//   • узлы не перекрываются;
//   • подписи рёбер не наезжают ни на узлы, ни друг на друга;
//   • ничто не уходит за пределы холста (нет клипа — в т.ч. слева/сверху);
//   • все рёбра отрисованы, step — перестановка 0..N-1;
//   • раскладка детерминирована.
// Если будущая правка контента/движка вернёт наезды или клип — тест покраснеет.

type Box = { x: number; y: number; w: number; h: number }
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const labelBox = (e: { labelX: number; labelY: number; labelW: number; labelH: number }): Box => ({
  x: e.labelX - e.labelW / 2,
  y: e.labelY - e.labelH / 2,
  w: e.labelW,
  h: e.labelH,
})

const chapters = MODULES.map((m) => m.number).sort((a, b) => a - b)
// undefined = одна строка (без переноса); узкие ширины = много переносов и
// активная «магистраль» (стресс маршрутов и разводки подписей).
const WIDTHS: (number | undefined)[] = [undefined, 600, 900, 1300]
const EPS = 0.5 // допуск на округление measureSize (Math.ceil)

for (const n of chapters) {
  for (const W of WIDTHS) {
    const tag = `гл.${n} @${W ?? 'auto'}`
    test(`${tag}: wrapped-flow раскладка здорова`, () => {
      const d = MODULE_DIAGRAMS[n]
      const out = layoutDiagramFlow(d, W)
      const { nodes, edges, width, height } = out

      // 1. узлы не перекрываются
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          expect(overlap(nodes[i], nodes[j]), `${tag}: узлы "${nodes[i].id}"∩"${nodes[j].id}"`).toBe(false)
        }
      }

      // 2. подписи рёбер: не на узлах и не друг на друге
      const labels = edges.filter((e) => e.label && e.labelW > 0).map(labelBox)
      for (let li = 0; li < labels.length; li++) {
        for (const nd of nodes) {
          expect(overlap(labels[li], nd), `${tag}: подпись#${li} наезжает на узел "${nd.id}"`).toBe(false)
        }
        for (let lj = li + 1; lj < labels.length; lj++) {
          expect(overlap(labels[li], labels[lj]), `${tag}: подписи #${li}∩#${lj}`).toBe(false)
        }
      }

      // 3. нет клипа: узлы и подписи целиком в пределах [0,width]×[0,height]
      for (const nd of nodes) {
        expect(nd.x, `${tag}: узел "${nd.id}" за левым краем`).toBeGreaterThanOrEqual(-EPS)
        expect(nd.y, `${tag}: узел "${nd.id}" выше верха`).toBeGreaterThanOrEqual(-EPS)
        expect(nd.x + nd.w, `${tag}: узел "${nd.id}" за правым краем`).toBeLessThanOrEqual(width + EPS)
        expect(nd.y + nd.h, `${tag}: узел "${nd.id}" ниже низа`).toBeLessThanOrEqual(height + EPS)
      }
      for (let li = 0; li < labels.length; li++) {
        const lb = labels[li]
        expect(lb.x, `${tag}: подпись#${li} за левым краем`).toBeGreaterThanOrEqual(-EPS)
        expect(lb.y, `${tag}: подпись#${li} выше верха`).toBeGreaterThanOrEqual(-EPS)
        expect(lb.x + lb.w, `${tag}: подпись#${li} за правым краем`).toBeLessThanOrEqual(width + EPS)
        expect(lb.y + lb.h, `${tag}: подпись#${li} ниже низа`).toBeLessThanOrEqual(height + EPS)
      }

      // 4. все рёбра отрисованы; step — перестановка 0..N-1
      expect(edges.length, `${tag}: все рёбра отрисованы`).toBe(d.edges.length)
      const steps = nodes.map((nd) => nd.step).sort((a, b) => a - b)
      expect(steps, `${tag}: step = 0..N-1`).toEqual(nodes.map((_, i) => i))

      // 5. детерминизм
      expect(JSON.stringify(layoutDiagramFlow(d, W)), `${tag}: детерминирована`).toBe(JSON.stringify(out))
    })
  }
}
