import { type TextareaHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'border-border bg-surface text-foreground w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs transition-colors',
        'placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
