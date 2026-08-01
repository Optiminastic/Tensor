import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DetailFieldProps {
  label: string
  value: ReactNode
  mono?: boolean
}

export function DetailField({ label, value, mono }: DetailFieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className={cn('text-foreground text-sm font-medium', mono && 'font-mono tabular-nums')}>
        {value}
      </p>
    </div>
  )
}
