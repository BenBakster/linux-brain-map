import { IBM_TOPICS } from './ibm'
import { MODULES } from './modules'

export type ReviewTrack = 'linux' | 'ibm'

export type ReviewCard = {
  id: string
  track: ReviewTrack
  topic: string
  prompt: string
  answer: string
  cue: string
}

const linuxCards: ReviewCard[] = MODULES.flatMap((module) =>
  module.table.map((row, index) => ({
    id: `linux:${module.id}:${index}`,
    track: 'linux',
    topic: `${module.number}. ${module.title}`,
    prompt: row.entity,
    answer: row.where,
    cue: row.signal,
  })),
)

const ibmCards: ReviewCard[] = IBM_TOPICS.flatMap((topic) =>
  topic.concepts.map((concept, index) => ({
    id: `ibm:${topic.id}:${index}`,
    track: 'ibm',
    topic: `${topic.number}. ${topic.title}`,
    prompt: concept.term,
    answer: concept.meaning,
    cue: concept.signal,
  })),
)

export const REVIEW_CARDS = [...linuxCards, ...ibmCards]
