const STORAGE_KEY = 'linux-brain-map-progress'
const HYGIENE_KEY = 'linux-brain-map-hygiene'

export type ProgressState = {
  completedModules: string[]
  quizScores: Record<string, number>
}

function readProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completedModules: [], quizScores: {} }
    return JSON.parse(raw) as ProgressState
  } catch {
    return { completedModules: [], quizScores: {} }
  }
}

function writeProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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

export function isModuleComplete(moduleId: string): boolean {
  return readProgress().completedModules.includes(moduleId)
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
  return checked
}

export function getHygienePercent(total: number): number {
  return Math.round((getHygieneChecked().size / total) * 100)
}