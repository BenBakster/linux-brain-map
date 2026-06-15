import { expect, test } from 'bun:test'

import { GLOSSARY, GLOSSARY_CATEGORIES, getGlossaryByCategory, getTerm } from '../src/data/glossary'
import { MODULES } from '../src/data/modules'

const MODULE_IDS = new Set(MODULES.map((m) => m.id))
const TERM_IDS = new Set(GLOSSARY.map((t) => t.id))

test('glossary has a meaningful number of terms', () => {
  expect(GLOSSARY.length).toBeGreaterThanOrEqual(50)
})

test('every term id is unique', () => {
  expect(TERM_IDS.size).toBe(GLOSSARY.length)
})

test('every term has the required non-empty fields', () => {
  for (const t of GLOSSARY) {
    expect(t.id, `id of ${t.term}`).toMatch(/^[a-z0-9-]+$/)
    expect(t.term.length, `term ${t.id}`).toBeGreaterThan(0)
    expect(t.category.length, `category ${t.id}`).toBeGreaterThan(0)
    expect(t.short.length, `short ${t.id}`).toBeGreaterThan(0)
    expect(t.body.length, `body ${t.id}`).toBeGreaterThanOrEqual(1)
    for (const para of t.body) expect(para.length, `body para ${t.id}`).toBeGreaterThan(0)
  }
})

test('every module backlink points to a real module', () => {
  for (const t of GLOSSARY) {
    for (const mid of t.modules) {
      expect(MODULE_IDS.has(mid), `term ${t.id} -> module ${mid}`).toBe(true)
    }
  }
})

test('every seeAlso points to a real term and is not self-referential', () => {
  for (const t of GLOSSARY) {
    for (const sid of t.seeAlso) {
      expect(TERM_IDS.has(sid), `term ${t.id} -> seeAlso ${sid}`).toBe(true)
      expect(sid, `term ${t.id} self seeAlso`).not.toBe(t.id)
    }
  }
})

test('getTerm resolves known ids and rejects unknown', () => {
  if (GLOSSARY.length > 0) {
    const first = GLOSSARY[0]
    expect(getTerm(first.id)?.id).toBe(first.id)
  }
  expect(getTerm('definitely-not-a-real-term')).toBeUndefined()
})

test('category grouping covers every term exactly once', () => {
  const grouped = getGlossaryByCategory()
  const flat = grouped.flatMap((g) => g.terms)
  expect(flat.length).toBe(GLOSSARY.length)
  expect(new Set(grouped.map((g) => g.category)).size).toBe(GLOSSARY_CATEGORIES.length)
})
