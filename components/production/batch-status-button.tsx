'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { patchBatchAction } from '@/app/dashboard/[brand]/production/actions'
import type { BatchStatus } from '@/components/production/types'
import { Button } from '@/components/ui/button'

interface BatchStatusButtonProps {
  brand: string
  batchId: string
  status: BatchStatus
}

// The one forward step available from each status - completed is a terminal
// state with nothing further to advance to.
const NEXT_STATUS: Partial<Record<BatchStatus, { target: BatchStatus; label: string }>> = {
  open: { target: 'in_progress', label: 'Start printing' },
  in_progress: { target: 'completed', label: 'Mark completed' },
}

/** Manual override: advance a Locked/Printing batch to the next lifecycle
 * status. A Draft batch shows the approve dialog instead (see
 * BatchDetailHeader); a Completed batch has nothing further to do. */
export function BatchStatusButton({
  brand,
  batchId,
  status,
}: BatchStatusButtonProps): JSX.Element | null {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const next = NEXT_STATUS[status]
  if (!next) return null

  async function advance(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await patchBatchAction(brand, batchId, { status: next?.target })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not update the batch.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => void advance()}>
        {pending ? 'Updating…' : next.label}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
