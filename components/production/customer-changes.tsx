'use client'

import { type JSX, useEffect, useState } from 'react'

import { ChangeList } from '@/components/production/change-list'
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
      <ChangeList changes={changes} />
    </div>
  )
}
