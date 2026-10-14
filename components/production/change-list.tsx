import type { JSX } from 'react'

import type { PersonalisationChange } from '@/lib/validators/personalisation-changes'

interface ChangeListProps {
  changes: PersonalisationChange[]
}

/**
 * What the customer corrected, old value struck through, new value plain.
 *
 * A pure list rendered from props, because three screens now ask the same
 * question from three different places: the job page fetches it, the queue's
 * hover card fetches it on hover, and the design queue already has it in the
 * list response. Only the markup is shared - whoever renders it decides where
 * the data comes from.
 *
 * Struck-through old and plain new, in that order, because whoever is reading
 * is about to make the new one and must not have to work out which is which.
 */
export function ChangeList({ changes }: ChangeListProps): JSX.Element {
  return (
    <dl className="flex flex-col gap-2">
      {changes.map(change => (
        <div key={change.label} className="flex flex-col gap-0.5">
          <dt className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
            {change.label}
          </dt>
          <dd className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted-foreground line-through">{change.from}</span>
            <span className="text-subtle-foreground">→</span>
            <span className="text-foreground font-medium">{change.to}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
