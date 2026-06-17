import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { REVIEW_CARDS, type ReviewTrack } from '@/data/review'
import {
  getDueCards,
  getReviewState,
  getReviewStats,
  rateCard,
  type ReviewRating,
} from '@/lib/review'

type ReviewDirection = 'forward' | 'reverse'

export function ReviewPage() {
  const [track, setTrack] = useState<ReviewTrack | 'all'>('all')
  const [direction, setDirection] = useState<ReviewDirection>('forward')
  const [revealed, setRevealed] = useState(false)
  const [, setRevision] = useState(0)

  const dueCards = getDueCards(REVIEW_CARDS, track).slice(0, 20)
  const card = dueCards[0]
  const stats = getReviewStats(REVIEW_CARDS)
  const state = card ? getReviewState(card.id) : undefined

  function handleRate(rating: ReviewRating) {
    if (!card) return
    rateCard(card.id, rating)
    setRevealed(false)
    setRevision((value) => value + 1)
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 grid gap-4">
        <Badge variant="outline" className="w-fit">
          Локальный FSRS-inspired планировщик
        </Badge>
        <Typography variant="h1" className="psy-title text-3xl font-bold">
          Интервальное повторение
        </Typography>
        <Typography tone="muted">
          Карточки строятся из учебных таблиц. Оценка ответа меняет дату следующего
          показа; история хранится только в этом браузере.
        </Typography>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card size="sm">
            <CardContent>
              <strong>{stats.due}</strong>
              <p className="text-sm text-muted-foreground">готово к повторению</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <strong>{stats.learned}</strong>
              <p className="text-sm text-muted-foreground">уже просмотрено</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <strong>{stats.total}</strong>
              <p className="text-sm text-muted-foreground">всего карточек</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'linux', 'ibm'] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={track === value ? 'default' : 'outline'}
            onClick={() => {
              setTrack(value)
              setRevealed(false)
            }}
          >
            {value === 'all' ? 'Все' : value === 'linux' ? 'Linux' : 'IBM'}
          </Button>
        ))}
        <Button
          type="button"
          variant={direction === 'forward' ? 'secondary' : 'outline'}
          onClick={() => {
            setDirection('forward')
            setRevealed(false)
          }}
        >
          Понятие → ответ
        </Button>
        <Button
          type="button"
          variant={direction === 'reverse' ? 'secondary' : 'outline'}
          onClick={() => {
            setDirection('reverse')
            setRevealed(false)
          }}
        >
          Сигнал → понятие
        </Button>
      </div>

      {card ? (
        <Card className="psy-highlight-card">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{card.track.toUpperCase()}</Badge>
              <Badge variant="outline">{card.topic}</Badge>
              {state && (
                <Badge variant="secondary">
                  S {state.stability} · D {state.difficulty}
                </Badge>
              )}
            </div>
            <CardTitle className="pt-4 text-2xl">
              {direction === 'forward' ? card.prompt : card.cue}
            </CardTitle>
            {direction === 'forward' && (
              <CardDescription>{card.cue}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="grid gap-5">
            {!revealed ? (
              <Button type="button" onClick={() => setRevealed(true)}>
                Показать ответ
              </Button>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <Typography variant="h5">
                    {direction === 'forward' ? card.answer : card.prompt}
                  </Typography>
                  {direction === 'reverse' && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {card.answer}
                    </p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRate('again')}
                  >
                    Снова
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRate('hard')}
                  >
                    Трудно
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRate('good')}
                  >
                    Хорошо
                  </Button>
                  <Button type="button" onClick={() => handleRate('easy')}>
                    Легко
                  </Button>
                </div>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              В очереди сегодня: {dueCards.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Очередь пуста</CardTitle>
            <CardDescription>
              Для выбранной колоды нет карточек, срок которых уже наступил.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  )
}

