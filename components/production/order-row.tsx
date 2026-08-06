'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent, type MouseEvent } from 'react'

import { createJobsFromOrder } from '@/app/dashboard/[brand]/production/actions'
import { ORDER_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderRecord } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'

interface OrderRowProps {
  brand: string
  order: OrderRecord
}

function stopRowClick(event: MouseEvent): void {
  event.stopPropagation()
}

export function OrderRow({ brand, order }: OrderRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = ORDER_STATUS_CONFIG[order.status]
  const href = `/dashboard/${brand}/production/orders/${order.id}`

  const openDetail = (): void => router.push(href)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  async function createJob(event: MouseEvent): Promise<void> {
    stopRowClick(event)
    setPending(true)
    setError(null)
    const res = await createJobsFromOrder(brand, order.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not create the job.')
      return
    }
    router.push(href)
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className="cursor-pointer"
      aria-label={`Open ${order.orderNumber}`}
    >
      <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
      <TableCell className="text-accent">{order.store}</TableCell>
      <TableCell className={order.customer ? undefined : 'text-muted-foreground'}>
        {order.customer ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground">{order.submittedAt}</TableCell>
      <TableCell numeric>₹{order.total.toLocaleString('en-IN')}</TableCell>
      <TableCell>
        <TonePill label={status.label} tone={status.tone} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={event => void createJob(event)}
          >
            <Plus className="size-3.5" aria-hidden />
            {pending ? 'Creating…' : 'Create Job'}
          </Button>
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
