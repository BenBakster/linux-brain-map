import { useState } from 'react'

import { Button } from '@/components/ui/button'

type CopyButtonProps = {
  text: string
  label?: string
}

export function CopyButton({ text, label = 'Копировать' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
      {copied ? 'Скопировано' : label}
    </Button>
  )
}