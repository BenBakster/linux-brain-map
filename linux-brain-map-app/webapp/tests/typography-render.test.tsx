import { expect, mock, test } from 'bun:test'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

type PrimitiveProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean
  children?: React.ReactNode
}

function SlotRoot({ children, className, ...props }: PrimitiveProps) {
  const child = React.Children.only(children)

  if (!React.isValidElement<{ className?: string }>(child)) {
    return null
  }

  return React.cloneElement(child, {
    ...props,
    ...child.props,
    className: [className, child.props.className].filter(Boolean).join(' '),
  })
}

mock.module('radix-ui', () => ({
  Slot: {
    Root: SlotRoot,
  },
}))

test('wrapped Button keeps child slot and Typography classes at runtime', async () => {
  const { Button } = await import('../src/components/ui/button')

  const markup = renderToStaticMarkup(
    <Button asChild className="text-background">
      <a href="/settings">Settings</a>
    </Button>,
  )

  expect(markup).toContain('href="/settings"')
  expect(markup).toContain('data-slot="button"')
  expect(markup).toContain('text-background')
  expect(markup).toContain('text-sm leading-none font-medium')
  expect(markup).not.toContain('data-slot="typography"')
})
