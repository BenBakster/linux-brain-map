import type { FlowStep } from '@/data/modules'
import { cn } from '@/lib/utils'

type FlowDiagramProps = {
  steps: FlowStep[]
  className?: string
}

export function FlowDiagram({ steps, className }: FlowDiagramProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="psy-flow-node rounded-xl px-4 py-2.5 text-center">
            <p className="psy-flow-label text-sm font-bold tracking-wide">{step.label}</p>
            {step.detail && (
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
            )}
          </div>
          {index < steps.length - 1 && (
            <span className="psy-arrow text-xl font-bold" aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}