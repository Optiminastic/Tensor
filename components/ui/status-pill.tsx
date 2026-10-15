import type { JSX } from 'react'

import type { PillTone } from '@/components/ui/pill-shape'
import { Tag } from '@/components/ui/tag'

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
    <Tag tone={config.tone} className={className}>
      {label ?? config.label}
    </Tag>
  )
}
