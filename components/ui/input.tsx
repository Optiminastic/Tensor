import { type InputHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'border-border bg-surface text-foreground h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-colors',
        'placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-accent focus-visible:ring-accent/30 focus-visible:ring-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // numeric fields align when they opt into the mono/tabular class
        'data-[numeric=true]:font-mono data-[numeric=true]:tabular-nums',
        className,
      )}
      {...props}
    />
  )
})
