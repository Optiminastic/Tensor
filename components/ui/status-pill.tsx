import type { JSX } from 'react'

import { PILL_DOT, pillClasses, type PillTone } from '@/components/ui/pill-shape'
import { cn } from '@/lib/utils'

/**
 * The Green / Yellow / Red design status from the costing spec.
 * Green = viable, Yellow = needs revision, Red = not viable.
 */
export type DesignStatus = 'green' | 'yellow' | 'red'

const STATUS_CONFIG: Record<DesignStatus, { label: string; tone: PillTone }> = {
  green: { label: 'Green', tone: 'success' },
  yellow: { label: 'Yellow', tone: 'warning' },
  red: { label: 'Red', tone: 'danger' },
}

export interface StatusPillProps {
  status: DesignStatus
  label?: string
  className?: string
}

export function StatusPill({ status, label, className }: StatusPillProps): JSX.Element {
  const config = STATUS_CONFIG[status]
  return (
    <span className={pillClasses(config.tone, className)}>
      <span className={cn('size-1.5 rounded-full', PILL_DOT[config.tone])} aria-hidden />
      {label ?? config.label}
    </span>
  )
}
