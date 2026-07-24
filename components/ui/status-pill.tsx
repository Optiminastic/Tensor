import type { JSX } from 'react'

import { cn } from '@/lib/utils'

/**
 * The Green / Yellow / Red design status from the costing spec.
 * Green = viable, Yellow = needs revision, Red = not viable.
 */
export type DesignStatus = 'green' | 'yellow' | 'red'

interface StatusConfig {
  label: string
  dot: string
  pill: string
}

const STATUS_CONFIG: Record<DesignStatus, StatusConfig> = {
  green: { label: 'Green', dot: 'bg-success', pill: 'bg-success-subtle text-success' },
  yellow: { label: 'Yellow', dot: 'bg-warning', pill: 'bg-warning-subtle text-warning' },
  red: { label: 'Red', dot: 'bg-danger', pill: 'bg-danger-subtle text-danger' },
}

export interface StatusPillProps {
  status: DesignStatus
  label?: string
  className?: string
}

export function StatusPill({ status, label, className }: StatusPillProps): JSX.Element {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
        config.pill,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.dot)} aria-hidden />
      {label ?? config.label}
    </span>
  )
}
