import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export type PillTone = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

const PILL_CLASSES: Record<PillTone, string> = {
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
  accent: 'bg-accent-subtle text-accent',
  muted: 'bg-surface-muted text-muted-foreground',
}

const DOT_CLASSES: Record<PillTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
  muted: 'bg-muted-foreground',
}

interface TonePillProps {
  label: string
  tone: PillTone
  className?: string
}

/** The dot-plus-label pill shape shared by StatusPill/DesignStatusBadge, generalized to any tone. */
export function TonePill({ label, tone, className }: TonePillProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
        PILL_CLASSES[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', DOT_CLASSES[tone])} aria-hidden />
      {label}
    </span>
  )
}
