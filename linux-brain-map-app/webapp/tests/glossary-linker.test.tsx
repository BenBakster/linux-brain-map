import { expect, test } from 'bun:test'
import { isValidElement, type ReactNode } from 'react'

import { linkifyProse } from '../src/components/GlossaryLinker'

function linkedIds(nodes: ReactNode[]): string[] {
  return nodes
    .filter((n) => isValidElement(n))
    .map((n) => (n as { props: { hash?: string } }).props.hash ?? '')
}

test('links a known unambiguous term, but only its first occurrence', () => {
  const out = linkifyProse('Вызов futex и снова futex в конце.', new Set())
  expect(linkedIds(out).filter((h) => h === 'futex').length).toBe(1)
})

test('drops ambiguous (collision) aliases — LSM and dm-crypt link to nothing', () => {
  const lsm = linkedIds(linkifyProse('Механизм LSM есть в ядре.', new Set()))
  expect(lsm).not.toContain('apparmor')
  expect(lsm).not.toContain('selinux')
  const dm = linkedIds(linkifyProse('Том зашифрован механизмом dm-crypt.', new Set()))
  expect(dm).not.toContain('luks')
  expect(dm).not.toContain('device-mapper')
})

test('does not link blocklisted generic words (kill, page, cow)', () => {
  const out = linkedIds(linkifyProse('Команда kill, слово page и аббревиатура cow.', new Set()))
  expect(out).not.toContain('signal')
  expect(out).not.toContain('page')
  expect(out).not.toContain('fork')
})

test('a shared seen set links each term at most once across paragraphs', () => {
  const seen = new Set<string>()
  linkifyProse('Первое упоминание futex.', seen)
  const second = linkifyProse('Второе упоминание futex.', seen)
  expect(linkedIds(second)).not.toContain('futex')
})
