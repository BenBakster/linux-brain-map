"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-4xl bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background:
            'linear-gradient(90deg, oklch(0.62 0.26 328), oklch(0.76 0.19 48), oklch(0.82 0.14 88))',
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
