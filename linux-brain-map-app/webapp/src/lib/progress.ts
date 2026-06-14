const STORAGE_KEY = 'linux-brain-map-progress'
const HYGIENE_KEY = 'linux-brain-map-hygiene'

export type ProgressState = {
  completedModules: string[]
  completedIbmTopics: string[]
  quizScores: Record<string, number>
}

const EMPTY_PROGRESS: ProgressState = {
  completedModules: [],
  completedIbmTopics: [],
  quizScores: {},
}

function readProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_PROGRESS }
    const stored = JSON.parse(raw) as Partial<ProgressState>
    return {
      completedModules: stored.completedModules ?? [],
      completedIbmTopics: stored.completedIbmTopics ?? [],
      quizScores: stored.quizScores ?? {},
    }
  } catch {
    return { ...EMPTY_PROGRESS }
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
  return checked
}

export function getHygienePercent(total: number): number {
  return Math.round((getHygieneChecked().size / total) * 100)
}
