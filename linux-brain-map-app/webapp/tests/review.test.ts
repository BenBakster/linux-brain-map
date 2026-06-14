import { beforeEach, expect, test } from 'bun:test'

const values = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
  configurable: true,
})

const review = await import('../src/lib/review')

beforeEach(() => values.clear())

test('good answer schedules a card in the future', () => {
  const now = Date.UTC(2026, 5, 14)
  const state = review.rateCard('card-1', 'good', now)

  expect(state.reviews).toBe(1)
  expect(state.due).toBeGreaterThan(now)
  expect(state.stability).toBeGreaterThanOrEqual(1)
})

test('again creates a short relearning interval and a lapse', () => {
  const now = Date.UTC(2026, 5, 14)
  const state = review.rateCard('card-1', 'again', now)

  expect(state.lapses).toBe(1)
  expect(state.due).toBeGreaterThan(now)
  expect(state.due).toBeLessThan(now + 60 * 60 * 1000)
})
