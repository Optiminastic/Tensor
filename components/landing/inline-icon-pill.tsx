import type { LucideIcon } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface InlineIconPillProps {
  icon: LucideIcon
  tone: 'sky' | 'lime'
}

/** The round icon set into a headline, between words, as in the inspiration. */
export function InlineIconPill({ icon: Icon, tone }: InlineIconPillProps): JSX.Element {
  return (
    <span
      aria-hidden
      className={cn(
        'mx-1 inline-grid size-[0.95em] translate-y-[0.08em] place-items-center rounded-full align-baseline',
        tone === 'sky' ? 'bg-landing-sky text-white' : 'bg-landing-lime text-landing-ink',
      )}
    >
      <Icon className="size-[0.5em]" strokeWidth={2.5} />
    </span>
  )
}
