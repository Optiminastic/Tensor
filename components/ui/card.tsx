import type { HTMLAttributes, JSX } from 'react'

import { cn } from '@/lib/utils'

type DivProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: DivProps): JSX.Element {
  return (
    <div
      className={cn('border-border bg-surface rounded-lg border shadow-xs', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: DivProps): JSX.Element {
  return (
    <div
      className={cn('border-border flex flex-col gap-1 border-b px-5 py-4', className)}
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
      className={cn('border-border flex items-center gap-3 border-t px-5 py-4', className)}
      {...props}
    />
  )
}
