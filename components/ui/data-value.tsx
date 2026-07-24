import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export interface DataValueProps {
  value: string | number
  unit?: string
  className?: string
}

/**
 * Inline numeric value in the tabular mono face — for costs, grams,
 * print times and any figure that appears in prose or a report row.
 */
export function DataValue({ value, unit, className }: DataValueProps): JSX.Element {
  return (
    <span className={cn('text-foreground font-mono tabular-nums', className)}>
      {value}
      {unit ? <span className="text-subtle-foreground ml-0.5">{unit}</span> : null}
    </span>
  )
}
