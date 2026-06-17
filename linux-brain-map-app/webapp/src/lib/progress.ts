import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'linux-brain-map-progress'
const HYGIENE_KEY = 'linux-brain-map-hygiene'

export type ProgressState = {
  completedModules: string[]
  completedIbmTopics: string[]
  quizScores: Record<string, number>
}

// Fresh structures per call: a shared constant spread with `{ ...x }` would
// alias the inner arrays/object, so a later `.push()` mutation would corrupt
// the "empty" template for every subsequent empty read.
function emptyProgress(): ProgressState {
  return { completedModules: [], completedIbmTopics: [], quizScores: {} }
}

// Observable store: writers persist to localStorage, swap the cached snapshot
// for a fresh reference, then notify subscribers. React reads via the hooks
// below (useSyncExternalStore) and re-renders when the snapshot identity changes.
const listeners = new Set<() => void>()

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit() {
  for (const listener of listeners) listener()
}

let progressSnapshot: ProgressState | null = null
let hygieneSnapshot: Set<string> | null = null

function readProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const stored = JSON.parse(raw) as Partial<ProgressState>
    return {
      completedModules: stored.completedModules ?? [],
      completedIbmTopics: stored.completedIbmTopics ?? [],
      quizScores: stored.quizScores ?? {},
    }
  } catch {
    return emptyProgress()
  }
}

function writeProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  progressSnapshot = state
  emit()
}

export function getProgress(): ProgressState {
  return readProgress()
}

export function markModuleComplete(moduleId: string) {
  const state = readProgress()
  if (!state.completedModules.includes(moduleId)) {
    state.completedModules.push(moduleId)
    writeProgress(state)
  }
}

export function markIbmTopicComplete(topicId: string) {
  const state = readProgress()
  if (!state.completedIbmTopics.includes(topicId)) {
    state.completedIbmTopics.push(topicId)
    writeProgress(state)
  }
}

export function setQuizScore(moduleId: string, score: number) {
  const state = readProgress()
  const prev = state.quizScores[moduleId] ?? 0
  if (score > prev) {
    state.quizScores[moduleId] = score
    writeProgress(state)
  }
}

export function getCompletionPercent(totalModules: number): number {
  const { completedModules } = readProgress()
  return Math.round((completedModules.length / totalModules) * 100)
}

export function getIbmCompletionPercent(totalTopics: number): number {
  const { completedIbmTopics } = readProgress()
  return Math.round((completedIbmTopics.length / totalTopics) * 100)
}

export function isModuleComplete(moduleId: string): boolean {
  return readProgress().completedModules.includes(moduleId)
}

export function isIbmTopicComplete(topicId: string): boolean {
  return readProgress().completedIbmTopics.includes(topicId)
}

// Hygiene checklist
export function getHygieneChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(HYGIENE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function toggleHygieneItem(id: string): Set<string> {
  const checked = getHygieneChecked()
  if (checked.has(id)) checked.delete(id)
  else checked.add(id)
  localStorage.setItem(HYGIENE_KEY, JSON.stringify([...checked]))
  // Snapshot is an independent copy so a caller holding the returned Set can
  // never mutate the live snapshot in place (would break store immutability).
  hygieneSnapshot = new Set(checked)
  emit()
  return checked
}

export function getHygienePercent(total: number): number {
  return Math.round((getHygieneChecked().size / total) * 100)
}

// --- React bindings (useSyncExternalStore) ---
// Snapshots are lazy so importing this module never touches localStorage (keeps
// it safe under SSR/static render and the test harness), and stable between
// writes so useSyncExternalStore does not loop.

function getProgressSnapshot(): ProgressState {
  if (progressSnapshot === null) progressSnapshot = readProgress()
  return progressSnapshot
}

function getHygieneSnapshot(): Set<string> {
  if (hygieneSnapshot === null) hygieneSnapshot = getHygieneChecked()
  return hygieneSnapshot
}

function percentOf(done: number, total: number): number {
  return Math.round((done / total) * 100)
}

/** Live progress snapshot; re-renders the caller whenever progress is written. */
export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getProgressSnapshot, getProgressSnapshot)
}

/** Live hygiene-checklist snapshot. */
export function useHygiene(): Set<string> {
  return useSyncExternalStore(subscribe, getHygieneSnapshot, getHygieneSnapshot)
}

export function useCompletionPercent(totalModules: number): number {
  return percentOf(useProgress().completedModules.length, totalModules)
}

export function useIbmCompletionPercent(totalTopics: number): number {
  return percentOf(useProgress().completedIbmTopics.length, totalTopics)
}

export function useHygienePercent(total: number): number {
  return percentOf(useHygiene().size, total)
}
