import { expect, test } from 'bun:test'

import { GLOSSARY } from '../src/data/glossary'
import { MODULES } from '../src/data/modules'
import {
  TIMELINE,
  TIMELINE_ERA_IDS,
  TIMELINE_ERAS,
  getEra,
  getEvent,
  getTimelineByEra,
} from '../src/data/timeline'

const MODULE_IDS = new Set(MODULES.map((m) => m.id))
const TERM_IDS = new Set(GLOSSARY.map((t) => t.id))
const EVENT_IDS = new Set(TIMELINE.map((e) => e.id))
const ERA_IDS = new Set(TIMELINE_ERA_IDS)

test('timeline has a meaningful number of events', () => {
  expect(TIMELINE.length).toBeGreaterThanOrEqual(40)
})

test('every event id is unique', () => {
  expect(EVENT_IDS.size).toBe(TIMELINE.length)
})

test('every event has the required well-formed fields', () => {
  for (const e of TIMELINE) {
    expect(e.id, `id of ${e.title}`).toMatch(/^[a-z0-9-]+$/)
    expect(Number.isFinite(e.year), `year ${e.id}`).toBe(true)
    expect(e.dateLabel.length, `dateLabel ${e.id}`).toBeGreaterThan(0)
    expect(e.title.length, `title ${e.id}`).toBeGreaterThan(0)
    expect(e.short.length, `short ${e.id}`).toBeGreaterThan(0)
    expect(e.body.length, `body ${e.id}`).toBeGreaterThanOrEqual(1)
    for (const para of e.body) expect(para.length, `body para ${e.id}`).toBeGreaterThan(0)
  }
})

test('every event belongs to a declared era', () => {
  for (const e of TIMELINE) {
    expect(ERA_IDS.has(e.era), `event ${e.id} -> era ${e.era}`).toBe(true)
  }
})

test('era ids are unique and getEra resolves them', () => {
  expect(ERA_IDS.size).toBe(TIMELINE_ERAS.length)
  for (const era of TIMELINE_ERAS) {
    expect(getEra(era.id)?.id).toBe(era.id)
    expect(era.label.length, `label ${era.id}`).toBeGreaterThan(0)
    expect(era.blurb.length, `blurb ${era.id}`).toBeGreaterThan(0)
  }
})

test('every module backlink points to a real module', () => {
  for (const e of TIMELINE) {
    for (const mid of e.modules) {
      expect(MODULE_IDS.has(mid), `event ${e.id} -> module ${mid}`).toBe(true)
    }
  }
})

test('every glossary backlink points to a real term', () => {
  for (const e of TIMELINE) {
    for (const tid of e.glossary) {
      expect(TERM_IDS.has(tid), `event ${e.id} -> term ${tid}`).toBe(true)
    }
  }
})

test('every seeAlso points to a real event and is not self-referential', () => {
  for (const e of TIMELINE) {
    for (const sid of e.seeAlso ?? []) {
      expect(EVENT_IDS.has(sid), `event ${e.id} -> seeAlso ${sid}`).toBe(true)
      expect(sid, `event ${e.id} self seeAlso`).not.toBe(e.id)
    }
  }
})

test('getEvent resolves known ids and rejects unknown', () => {
  if (TIMELINE.length > 0) {
    const first = TIMELINE[0]
    expect(getEvent(first.id)?.id).toBe(first.id)
  }
  expect(getEvent('definitely-not-a-real-event')).toBeUndefined()
})

test('era grouping covers every event exactly once, in chronological era order', () => {
  const grouped = getTimelineByEra()
  expect(grouped.map((g) => g.era.id)).toEqual(TIMELINE_ERA_IDS)
  const flat = grouped.flatMap((g) => g.events)
  expect(flat.length).toBe(TIMELINE.length)
  expect(new Set(flat.map((e) => e.id)).size).toBe(TIMELINE.length)
})

test('events within each era are sorted ascending by year', () => {
  for (const { events } of getTimelineByEra()) {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].year, `era ${events[i].era} order`).toBeGreaterThanOrEqual(
        events[i - 1].year,
      )
    }
  }
})
