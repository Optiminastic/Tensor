import { type LabelHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        'text-foreground text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
