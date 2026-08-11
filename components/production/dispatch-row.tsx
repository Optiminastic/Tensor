'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { markOrderDispatched } from '@/app/dashboard/[brand]/production/dispatch-actions'
import { DISPATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { dateTime } from '@/lib/format'
import type { DispatchOrder } from '@/lib/validators/dispatch'

interface DispatchRowProps {
  brand: string
  dispatch: DispatchOrder
  // Human-readable order number for dispatch.order_id, when the caller could
  // resolve it - dispatch records carry only the id.
  orderNumber: string | null
}

/** One shipment record. Only a 'pending' (booked) row can be handed over;
 * once dispatched the backend has stamped dispatched_at and there is nothing
 * left to do from here. */
export function DispatchRow({ brand, dispatch, orderNumber }: DispatchRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function dispatchNow(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await markOrderDispatched(brand, dispatch.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not mark the order as dispatched.')
      return
    }
    router.refresh()
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm whitespace-nowrap">
        {orderNumber ?? dispatch.order_id.slice(0, 8)}
      </TableCell>
      <TableCell>{dispatch.carrier ?? '—'}</TableCell>
      <TableCell className="font-mono text-sm">{dispatch.tracking_number ?? '—'}</TableCell>
      <TableCell>
        <TonePill {...DISPATCH_STATUS_CONFIG[dispatch.status]} />
      </TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {dispatch.dispatched_at ? dateTime(dispatch.dispatched_at) : '—'}
      </TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {dateTime(dispatch.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          {dispatch.status === 'pending' ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => void dispatchNow()}
            >
              {pending ? 'Marking…' : 'Mark dispatched'}
            </Button>
          ) : null}
          {error ? (
            <p role="alert" className="text-danger text-xs">
              {error}
            </p>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
