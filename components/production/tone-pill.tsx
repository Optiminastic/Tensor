import type { JSX } from 'react'

import { PILL_DOT, pillClasses, type PillTone } from '@/components/ui/pill-shape'
import { cn } from '@/lib/utils'

export type { PillTone }

interface TonePillProps {
  label: string
  tone: PillTone
  className?: string
}

/** The dot-plus-label status pill, in the shared shape (components/ui/pill-shape.ts). */
export function TonePill({ label, tone, className }: TonePillProps): JSX.Element {
  return (
    <span className={pillClasses(tone, className)}>
      <span className={cn('size-1.5 rounded-full', PILL_DOT[tone])} aria-hidden />
      {label}
    </span>
  )
}
