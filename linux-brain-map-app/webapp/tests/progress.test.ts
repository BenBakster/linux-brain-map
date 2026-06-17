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

test('subscribers are notified when progress actually changes', () => {
  let calls = 0
  const unsub = progress.subscribe(() => {
    calls += 1
  })

  progress.markModuleComplete('boot')
  progress.markIbmTopicComplete('cryptography')
  progress.setQuizScore('boot', 2)

  expect(calls).toBe(3)
  unsub()
})

test('no-op writes do not notify subscribers', () => {
  progress.markModuleComplete('boot')
  progress.setQuizScore('boot', 3)

  let calls = 0
  const unsub = progress.subscribe(() => {
    calls += 1
  })

  progress.markModuleComplete('boot') // already complete → no write
  progress.setQuizScore('boot', 2) // 2 < 3 → no write

  expect(calls).toBe(0)
  unsub()
})

test('empty-state reads are not aliased to a shared template', () => {
  // Regression: readProgress used to spread a module-level EMPTY_PROGRESS, so a
  // mutator's .push() corrupted the shared inner arrays. A later empty read must
  // still return fresh, empty structures.
  progress.markModuleComplete('boot')
  progress.markIbmTopicComplete('cryptography')

  values.clear()

  expect(progress.getProgress().completedModules).toEqual([])
  expect(progress.getProgress().completedIbmTopics).toEqual([])
})

test('toggling a hygiene item notifies subscribers', () => {
  let calls = 0
  const unsub = progress.subscribe(() => {
    calls += 1
  })

  progress.toggleHygieneItem('updates')
  progress.toggleHygieneItem('updates')

  expect(calls).toBe(2)
  unsub()
})
