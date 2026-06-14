import type { ReviewCard, ReviewTrack } from '@/data/review'

const REVIEW_KEY = 'linux-brain-map-review-v1'
const DAY = 24 * 60 * 60 * 1000

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export type ReviewState = {
  due: number
  stability: number
  difficulty: number
  reviews: number
  lapses: number
  lastReview?: number
}

type ReviewStore = Record<string, ReviewState>

function readStore(): ReviewStore {
  try {
    const raw = localStorage.getItem(REVIEW_KEY)
    return raw ? (JSON.parse(raw) as ReviewStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: ReviewStore) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(store))
}

export function getReviewState(cardId: string): ReviewState | undefined {
  return readStore()[cardId]
}

export function getDueCards(
  cards: ReviewCard[],
  track: ReviewTrack | 'all',
  now = Date.now(),
): ReviewCard[] {
  const store = readStore()
  return cards
    .filter((card) => track === 'all' || card.track === track)
    .filter((card) => !store[card.id] || store[card.id].due <= now)
    .sort((a, b) => (store[a.id]?.due ?? 0) - (store[b.id]?.due ?? 0))
}

export function getReviewStats(cards: ReviewCard[], now = Date.now()) {
  const store = readStore()
  const learned = cards.filter((card) => store[card.id]?.reviews).length
  const due = cards.filter(
    (card) => !store[card.id] || store[card.id].due <= now,
  ).length
  return { learned, due, total: cards.length }
}

export function rateCard(
  cardId: string,
  rating: ReviewRating,
  now = Date.now(),
): ReviewState {
  const store = readStore()
  const previous = store[cardId] ?? {
    due: now,
    stability: 0.4,
    difficulty: 5,
    reviews: 0,
    lapses: 0,
  }
  const elapsedDays = previous.lastReview
    ? Math.max(0, (now - previous.lastReview) / DAY)
    : 0
  const retrievability = Math.exp(
    -elapsedDays / Math.max(previous.stability, 0.1),
  )

  let stability: number
  let difficulty: number
  let intervalDays: number
  let lapses: number

  if (rating === 'again') {
    stability = Math.max(0.2, previous.stability * 0.45)
    difficulty = Math.min(10, previous.difficulty + 0.8)
    intervalDays = 10 / (24 * 60)
    lapses = previous.lapses + 1
  } else {
    const ratingBonus =
      rating === 'easy' ? 1.8 : rating === 'good' ? 1 : 0.55
    const recallBonus = 1 + (1 - retrievability) * 0.8
    stability = Math.max(
      rating === 'hard' ? 0.7 : 1,
      previous.stability * (1 + ratingBonus * recallBonus),
    )
    difficulty = Math.min(
      10,
      Math.max(
        1,
        previous.difficulty +
          (rating === 'hard' ? 0.35 : rating === 'easy' ? -0.45 : -0.1),
      ),
    )
    intervalDays =
      rating === 'hard'
        ? Math.max(1, stability * 0.65)
        : rating === 'easy'
          ? Math.max(4, stability * 1.8)
          : Math.max(1, stability)
    lapses = previous.lapses
  }

  const next: ReviewState = {
    due: now + intervalDays * DAY,
    stability: Number(stability.toFixed(2)),
    difficulty: Number(difficulty.toFixed(2)),
    reviews: previous.reviews + 1,
    lapses,
    lastReview: now,
  }
  store[cardId] = next
  writeStore(store)
  return next
}
