import { expect, test } from 'bun:test'

import { MODULES } from '../src/data/modules'

test('every module carries an epigraph', () => {
  const missing = MODULES.filter((m) => !m.epigraph).map((m) => m.id)
  expect(missing).toEqual([])
})

test('every epigraph has non-empty text and author', () => {
  const broken = MODULES.filter(
    (m) => !m.epigraph?.text?.trim() || !m.epigraph?.author?.trim(),
  ).map((m) => m.id)
  expect(broken).toEqual([])
})
