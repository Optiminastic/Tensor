import type { HTMLAttributes, JSX } from 'react'

import type { PillTone } from '@/components/ui/pill-shape'
import { Tag } from '@/components/ui/tag'
import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'

const STATUS_TONE: Record<Exclude<BadgeTone, 'outline'>, PillTone> = {
  neutral: 'muted',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
}

const OUTLINE =
  'border-border text-muted-foreground inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium whitespace-nowrap'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone | null
}

/**
 * Every tone but outline is a status tag (components/ui/tag.tsx), icon and
 * all. Outline stays a quiet bordered label, for facts that are not a status -
 * which brand a design belongs to.
 */
export function Badge({ className, tone, children, ...props }: BadgeProps): JSX.Element {
  if (tone === 'outline') {
    return (
      <span className={cn(OUTLINE, className)} {...props}>
        {children}
      </span>
    )
  }
  return (
    <Tag tone={STATUS_TONE[tone ?? 'neutral']} className={className}>
      {children}
    </Tag>
  )
}
