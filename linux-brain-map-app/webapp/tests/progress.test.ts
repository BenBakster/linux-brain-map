import { beforeEach, expect, test } from 'bun:test'

const values = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
  configurable: true,
})

const progress = await import('../src/lib/progress')

beforeEach(() => values.clear())

test('IBM completion does not change Linux completion', () => {
  progress.markIbmTopicComplete('cryptography')

  expect(progress.getCompletionPercent(12)).toBe(0)
  expect(progress.getIbmCompletionPercent(6)).toBe(17)
})

test('legacy progress migrates without losing Linux modules', () => {
  values.set(
    'linux-brain-map-progress',
    JSON.stringify({ completedModules: ['security'], quizScores: {} }),
  )

  expect(progress.isModuleComplete('security')).toBe(true)
  expect(progress.getProgress().completedIbmTopics).toEqual([])
})
