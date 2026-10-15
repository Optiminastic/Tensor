'use client'

import { AlertTriangle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type JSX, useState } from 'react'

import { createJobsFromOrder } from '@/app/dashboard/[brand]/production/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface OrderJobRetryProps {
  brand: string
  orderId: string
  /** What the import worker said when it gave up, or null on a healthy order. */
  jobCreationError: string | null
}

/**
 * The retry for an order whose jobs were never created.
 *
 * IT LIVES HERE BECAUSE IT LEFT THE TABLE. "Create Job" used to sit in an
 * Actions column on every row of the orders list, where it did nothing at all
 * on the thousands of orders that imported correctly and mattered on the
 * handful that did not. The column went; the capability should not, because
 * an order with no production jobs makes nothing and nobody is told again -
 * the import worker has already exhausted its attempts.
 *
 * So it shows on the order itself, and only when there is something to retry.
 * A healthy order renders nothing.
 */
export function OrderJobRetry({
  brand,
  orderId,
  jobCreationError,
}: OrderJobRetryProps): JSX.Element | null {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!jobCreationError) return null

  async function retry(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await createJobsFromOrder(brand, orderId)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not create the jobs.')
      return
    }
    router.refresh()
  }

  return (
    <Card className="border-danger/40 flex flex-col gap-3 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-danger mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">This order made no production jobs.</p>
          {/* The reason, not just the fact. It is the only record of what went
              wrong and it is what tells somebody whether retrying will help. */}
          <p className="text-muted-foreground text-xs break-words">{jobCreationError}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => void retry()}
        >
          <Plus className="size-3.5" aria-hidden />
          {pending ? 'Creating…' : 'Create jobs'}
        </Button>
        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
