'use client'

import { type JSX, useState } from 'react'

import { PERSONALISATION_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { PersonalisationStatus } from '@/components/production/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { PersonalisationChange } from '@/lib/validators/personalisation-changes'
import { fetchPersonalisationChanges } from '@/services/personalisation-changes.service'

interface PersonalisationTagProps {
  jobId: string
  status: PersonalisationStatus
}

/**
 * How the customer's check stands, and - when they changed something - what.
 *
 * FETCHED ON HOVER, not with the row. The queue carries hundreds of jobs and
 * the values behind "Changed" are wanted for the one somebody is pointing at;
 * sending them all would put every customer's old and new names into every
 * page load of a screen that mostly shows neither.
 *
 * Only "Changed" opens anything. A tag that looks interactive and then says
 * "nothing to show" is worse than a tag that plainly is not.
 */
export function PersonalisationTag({ jobId, status }: PersonalisationTagProps): JSX.Element {
  const config = PERSONALISATION_STATUS_CONFIG[status]
  const [changes, setChanges] = useState<PersonalisationChange[] | null>(null)
  const [failed, setFailed] = useState(false)

  if (status !== 'changed') {
    return <TonePill {...config} />
  }

  function load(open: boolean): void {
    // Once. The values are frozen the moment the window closes, so a second
    // fetch would return the same answer.
    if (!open || changes !== null || failed) return
    void fetchPersonalisationChanges(jobId)
      .then(setChanges)
      .catch(() => setFailed(true))
  }

  return (
    <HoverCard openDelay={120} onOpenChange={load}>
      <HoverCardTrigger asChild>
        {/* A button, not a span: the card has to be reachable from the
            keyboard, and hover alone never is. */}
        <button type="button" className="cursor-help">
          <TonePill {...config} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <p className="text-subtle-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
          What the customer changed
        </p>
        {failed ? (
          <p className="text-muted-foreground text-sm">Could not read the changes.</p>
        ) : changes === null ? (
          <p className="text-muted-foreground text-sm">Reading…</p>
        ) : changes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing was changed after all.</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {changes.map(change => (
              <div key={change.label} className="flex flex-col gap-0.5">
                <dt className="text-subtle-foreground text-xs">{change.label}</dt>
                <dd className="flex flex-wrap items-center gap-1.5 text-sm">
                  {/* The old value struck through, the new one plain. The
                      person reading this is about to make the new one and
                      needs to see at a glance which is which. */}
                  <span className="text-muted-foreground line-through">{change.from}</span>
                  <span className="text-subtle-foreground">→</span>
                  <span className="text-foreground font-medium">{change.to}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
