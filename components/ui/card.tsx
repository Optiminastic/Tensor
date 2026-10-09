import type { HTMLAttributes, JSX } from 'react'

import { cn } from '@/lib/utils'

type DivProps = HTMLAttributes<HTMLDivElement>

/**
 * A white panel on the page's grey ground.
 *
 * The lift comes from the surface change and a soft shadow, not from an
 * outline: the hairline closes the shape, it does not draw a box around it.
 * A heavier border on every card is what made the old UI read as a stack of
 * framed boxes rather than as content on a page.
 */
export function Card({ className, ...props }: DivProps): JSX.Element {
  return (
    <div
      className={cn(
        'border-border/70 bg-surface rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: DivProps): JSX.Element {
  return (
    <div
      className={cn('border-border/70 flex flex-col gap-1 border-b px-5 py-4', className)}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h3
      className={cn('text-foreground text-sm font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return <p className={cn('text-muted-foreground text-sm', className)} {...props} />
}

export function CardContent({ className, ...props }: DivProps): JSX.Element {
  return <div className={cn('px-5 py-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: DivProps): JSX.Element {
  return (
    <div
      className={cn('border-border/70 flex items-center gap-3 border-t px-5 py-4', className)}
      {...props}
    />
  )
}
