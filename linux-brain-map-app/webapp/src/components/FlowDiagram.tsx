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
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center shadow-sm">
            <p className="text-sm font-semibold text-primary">{step.label}</p>
            {step.detail && (
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
            )}
          </div>
          {index < steps.length - 1 && (
            <span className="text-lg text-muted-foreground" aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}