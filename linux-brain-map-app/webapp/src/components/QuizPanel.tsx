import { useState } from 'react'

import type { QuizQuestion } from '@/data/modules'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { markModuleComplete, setQuizScore } from '@/lib/progress'

type QuizPanelProps = {
  moduleId: string
  questions: QuizQuestion[]
}

export function QuizPanel({ moduleId, questions }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = questions.reduce((acc, q, i) => {
    return acc + (answers[i] === q.correctIndex ? 1 : 0)
  }, 0)

  function handleSubmit() {
    setSubmitted(true)
    setQuizScore(moduleId, score)
    if (score === questions.length) {
      markModuleComplete(moduleId)
    }
  }

  return (
    <div className="grid gap-4">
      {questions.map((q, qi) => (
        <Card key={qi} size="sm">
          <CardHeader>
            <CardTitle className="text-base">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi
              const isCorrect = oi === q.correctIndex
              const showResult = submitted

              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    selected && !showResult && 'border-primary bg-primary/10',
                    showResult &&
                      isCorrect &&
                      'border-[oklch(0.58_0.14_145)] bg-[oklch(0.58_0.14_145/0.15)] shadow-[0_0_10px_oklch(0.58_0.14_145/0.3)]',
                    showResult && selected && !isCorrect && 'border-destructive bg-destructive/15',
                    !selected && !showResult && 'hover:bg-muted',
                  )}
                >
                  {opt}
                </button>
              )
            })}
            {submitted && (
              <p className="mt-2 text-sm text-muted-foreground">{q.explanation}</p>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        {!submitted ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
          >
            Проверить
          </Button>
        ) : (
          <p className="text-sm font-medium">
            Результат: {score}/{questions.length}
            {score === questions.length && ' — модуль засчитан!'}
          </p>
        )}
      </div>
    </div>
  )
}