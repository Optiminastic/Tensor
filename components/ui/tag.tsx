import { Circle, CircleAlert, CircleCheck, CircleDot, Clock3, type LucideIcon } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { pillClasses, type PillTone } from '@/components/ui/pill-shape'

/**
 * Each tone's icon, one family of circles so a row of tags reads as a set:
 * done, waiting, stopped, under way, nothing yet. The word always says which;
 * the icon is a second cue for a reader who cannot tell the hues apart.
 */
const TONE_ICONS: Record<PillTone, LucideIcon> = {
  success: CircleCheck,
  warning: Clock3,
  danger: CircleAlert,
  accent: CircleDot,
  muted: Circle,
}

interface TagProps {
  tone: PillTone
  children: ReactNode
  /** Replaces the tone's icon, e.g. a spinner while something is running. */
  icon?: ReactNode
  className?: string
}

/** A status tag: the shared shape (pill-shape.ts) with its tone's icon. */
export function Tag({ tone, children, icon, className }: TagProps): JSX.Element {
  const Icon = TONE_ICONS[tone]
  return (
    <span className={pillClasses(tone, className)}>
      {icon ?? <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />}
      {children}
    </span>
  )
}
