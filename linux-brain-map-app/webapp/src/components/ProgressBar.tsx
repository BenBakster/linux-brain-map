import { Progress } from '@/components/ui/progress'

type ProgressBarProps = {
  value: number
  label: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}