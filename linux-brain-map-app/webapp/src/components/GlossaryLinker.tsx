import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { GLOSSARY } from '@/data/glossary'

type Matcher = { re: RegExp; map: Map<string, string> }

let cached: Matcher | null = null

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Aliases worth auto-linking inside prose: letter-initial, >= 3 chars, letters/digits/hyphen only.
// Excludes ultra-short or symbol-heavy aliases (e.g. 'Z', 'fork()', '%util', '/proc', 'page cache')
// that would mis-match common words or fragments. Multi-word phrases are intentionally skipped.
const SAFE_ALIAS = /^\p{L}[\p{L}\p{N}-]{2,}$/u

// Generic words that pass SAFE_ALIAS but are too common to auto-link safely in prose.
// They stay searchable on the glossary page; they just don't become inline links.
const BLOCKLIST = new Set(['kill', 'page', 'cow'])

function getMatcher(): Matcher {
  if (cached) return cached
  // First pass: which term ids claim each candidate alias (lowercased)?
  const claims = new Map<string, Set<string>>()
  for (const term of GLOSSARY) {
    for (const alias of term.aliases) {
      if (!SAFE_ALIAS.test(alias)) continue
      const key = alias.toLowerCase()
      if (BLOCKLIST.has(key)) continue
      let ids = claims.get(key)
      if (!ids) {
        ids = new Set()
        claims.set(key, ids)
      }
      ids.add(term.id)
    }
  }
  // Second pass: keep only UNAMBIGUOUS aliases (exactly one claiming term). Aliases claimed by
  // several terms (e.g. 'lsm' -> apparmor+selinux, 'dm-crypt' -> luks+device-mapper) are dropped,
  // so a generic name never silently links to one arbitrary implementation.
  const map = new Map<string, string>()
  const aliases: string[] = []
  for (const term of GLOSSARY) {
    for (const alias of term.aliases) {
      if (!SAFE_ALIAS.test(alias)) continue
      const key = alias.toLowerCase()
      if (BLOCKLIST.has(key)) continue
      if (claims.get(key)?.size !== 1) continue
      if (map.has(key)) continue
      map.set(key, term.id)
      aliases.push(alias)
    }
  }
  // Longest first so a more specific alias wins over a shorter prefix of it.
  aliases.sort((a, b) => b.length - a.length)
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}_])(${aliases.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}_])`,
    'giu',
  )
  cached = { re, map }
  return cached
}

/**
 * Wrap the first occurrence of each known glossary term in `text` with a link to
 * its glossary entry. `seen` is shared across one module's paragraphs so each term
 * links at most once per module. Returns React children (plain strings + Links).
 */
export function linkifyProse(text: string, seen: Set<string>): ReactNode[] {
  const { re, map } = getMatcher()
  re.lastIndex = 0
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const matched = m[1]
    const id = map.get(matched.toLowerCase())
    if (!id || seen.has(id)) continue
    seen.add(id)
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <Link
        key={`gl-${id}-${key++}`}
        to="/glossary"
        hash={id}
        title="Определение в глоссарии"
        className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-foreground hover:decoration-accent"
      >
        {matched}
      </Link>,
    )
    last = m.index + matched.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
