import type { JSX } from 'react'

import { pillClasses, type PillTone } from '@/components/ui/pill-shape'

export type { PillTone }

interface TonePillProps {
  label: string
  tone: PillTone
  className?: string
}

/** A status tag, in the shared shape (components/ui/pill-shape.ts). */
export function TonePill({ label, tone, className }: TonePillProps): JSX.Element {
  return <span className={pillClasses(tone, className)}>{label}</span>
}
