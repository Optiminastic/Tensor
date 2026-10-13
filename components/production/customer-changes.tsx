'use client'

import { type JSX, useEffect, useState } from 'react'

import type { PersonalisationChange } from '@/lib/validators/personalisation-changes'
import { fetchPersonalisationChanges } from '@/services/personalisation-changes.service'

interface CustomerChangesProps {
  jobId: string
}

/**
 * What the customer corrected on their own link, beside what they ordered.
 *
 * SHOWN ON THE JOB, not only on the queue's hover card. By the time somebody
 * is reading this page they are about to make the thing, and "the customer
 * changed the spelling after ordering" is the single most useful sentence on
 * it - the hover card is for spotting which jobs to open, and this is for the
 * person who opened one.
 *
 * Renders nothing when nothing changed, which is most jobs. An empty panel
 * headed "changes" on every job would train people to stop reading it.
 */
export function CustomerChanges({ jobId }: CustomerChangesProps): JSX.Element | null {
  const [changes, setChanges] = useState<PersonalisationChange[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchPersonalisationChanges(jobId)
      .then(result => {
        if (!cancelled) setChanges(result)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [jobId])

  if (!changes || changes.length === 0) return null

  return (
    <div className="border-warning-subtle bg-warning-subtle/40 flex flex-col gap-2 rounded-md border p-3">
      <p className="text-foreground text-xs font-medium">
        The customer corrected this after ordering
      </p>
      <dl className="flex flex-col gap-2">
        {changes.map(change => (
          <div key={change.label} className="flex flex-col gap-0.5">
            <dt className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
              {change.label}
            </dt>
            <dd className="flex flex-wrap items-center gap-1.5 text-sm">
              {/* Struck-through old, plain new. Whoever reads this is about to
                  make the new one and must not have to work out which is
                  which. */}
              <span className="text-muted-foreground line-through">{change.from}</span>
              <span className="text-subtle-foreground">→</span>
              <span className="text-foreground font-medium">{change.to}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
