import { expect, test } from 'bun:test'

import { COMPARE_TABLES, getCompareTable } from '../src/data/compare'
import { GLOSSARY } from '../src/data/glossary'
import { MODULES } from '../src/data/modules'

const MODULE_IDS = new Set(MODULES.map((m) => m.id))
const TERM_IDS = new Set(GLOSSARY.map((t) => t.id))

test('compare table ids are unique and non-empty', () => {
  const ids = COMPARE_TABLES.map((t) => t.id)
  expect(ids.every((id) => id.trim().length > 0)).toBe(true)
  expect(new Set(ids).size).toBe(ids.length)
})

test('every table has columns and at least two rows', () => {
  for (const t of COMPARE_TABLES) {
    expect(t.columns.length).toBeGreaterThan(1)
    expect(t.rows.length).toBeGreaterThan(1)
  }
})

test('every row has exactly one cell per column', () => {
  const bad: string[] = []
  for (const t of COMPARE_TABLES) {
    t.rows.forEach((row, i) => {
      if (row.cells.length !== t.columns.length) bad.push(`${t.id}#${i}`)
    })
  }
  expect(bad).toEqual([])
})

test('all cells are non-empty strings', () => {
  for (const t of COMPARE_TABLES) {
    for (const row of t.rows) {
      for (const cell of row.cells) {
        expect(cell.trim().length).toBeGreaterThan(0)
      }
    }
  }
})

test('every row glossaryId resolves to an existing term', () => {
  const missing: string[] = []
  for (const t of COMPARE_TABLES) {
    for (const row of t.rows) {
      if (row.glossaryId && !TERM_IDS.has(row.glossaryId)) {
        missing.push(`${t.id}:${row.glossaryId}`)
      }
    }
  }
  expect(missing).toEqual([])
})

test('every table module backlink resolves to an existing module', () => {
  const missing: string[] = []
  for (const t of COMPARE_TABLES) {
    for (const mid of t.modules ?? []) {
      if (!MODULE_IDS.has(mid)) missing.push(`${t.id}:${mid}`)
    }
  }
  expect(missing).toEqual([])
})

test('getCompareTable finds tables by id and returns undefined otherwise', () => {
  expect(getCompareTable('schedulers')?.title).toBe('Планировщики CPU')
  expect(getCompareTable('nonexistent')).toBeUndefined()
})
