import { Check } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

import { SEND_BACK_REASONS } from './send-back-comment'

interface ReasonChipsProps {
  selected: string[]
  onToggle: (reason: string) => void
}

/** Quick reasons as toggle chips; aria-pressed and a tick say which are on. */
export function ReasonChips({ selected, onToggle }: ReasonChipsProps): JSX.Element {
  return (
    <div role="group" aria-label="What needs work" className="flex flex-wrap gap-2">
      {SEND_BACK_REASONS.map(reason => {
        const on = selected.includes(reason)
        return (
          <button
            key={reason}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(reason)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              on
                ? 'bg-foreground text-background'
                : 'bg-surface ring-border-strong text-muted-foreground hover:text-foreground ring-1',
            )}
          >
            {on ? <Check className="size-3.5" aria-hidden /> : null}
            {reason}
          </button>
        )
      })}
    </div>
  )
}
