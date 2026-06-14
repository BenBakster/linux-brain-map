import { expect, test } from 'bun:test'

import { ATTACK_TACTICS, IBM_TOPICS, KILL_CHAIN } from '../src/data/ibm'

test('IBM material is complete and quizzes are valid', () => {
  expect(IBM_TOPICS.length).toBe(6)
  expect(KILL_CHAIN.length).toBe(7)
  expect(ATTACK_TACTICS.length).toBe(12)

  for (const topic of IBM_TOPICS) {
    expect(topic.concepts.length).toBeGreaterThanOrEqual(6)
    expect(topic.takeaways.length).toBeGreaterThanOrEqual(3)
    expect(topic.quiz.length).toBeGreaterThanOrEqual(2)

    for (const question of topic.quiz) {
      expect(question.options.length).toBeGreaterThanOrEqual(2)
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(question.correctIndex).toBeLessThan(question.options.length)
    }
  }
})
