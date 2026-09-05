'use client'

import { AlertTriangle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent, type MouseEvent } from 'react'

import { createJobsFromOrder } from '@/app/dashboard/[brand]/production/actions'
import { FailureNote, failureRowClass } from '@/components/production/failure-note'
import { ORDER_STATUS_CONFIG, shopifyStatusConfig } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderRecord } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface OrderRowProps {
  brand: string
  order: OrderRecord
}

function stopRowClick(event: MouseEvent): void {
  event.stopPropagation()
}

/**
 * One of Shopify's statuses as a Tensor pill, or a dash when it has nothing to
 * say.
 *
 * A dash for both "Shopify never told us" and "there is nothing here" -
 * an unfulfilled order genuinely has no delivery status, and an order nobody
 * returned reports "no_return". Neither is worth a pill on every row.
 */
function StatusCell({ value }: { value: string | null }): JSX.Element {
  const config = value ? shopifyStatusConfig(value) : null
  if (!config || config.label === '—') {
    return <span className="text-muted-foreground">—</span>
  }
  return <TonePill label={config.label} tone={config.tone} />
}

export function OrderRow({ brand, order }: OrderRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = ORDER_STATUS_CONFIG[order.status]
  // From the backend: the list response carries a count rather than the line
  // items themselves, so counting them here would give zero on every row.
  const itemCount = order.itemCount
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
      className={cn('cursor-pointer', failureRowClass(Boolean(order.jobCreationError)))}
      aria-label={`Open ${order.orderNumber}`}
    >
      {/* nowrap and a tighter vertical rhythm: with thirteen columns the
          default padding pushed every row to two lines and "T3DPS-114762"
          broke across them, which reads as two different orders at a glance. */}
      <TableCell className="py-2 font-mono text-sm whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          {order.orderNumber}
          {/* This order produced no production jobs and never will on its own -
              the backend's import worker exhausted its retries. Create Job is
              the retry, so the warning belongs next to it, not hidden. */}
          {order.jobCreationError ? (
            <span className="text-danger">
              <AlertTriangle className="size-3.5" aria-hidden />
              <span className="sr-only">Job creation failed</span>
            </span>
          ) : null}
        </span>
        {/* The reason itself, not only the triangle. It used to live in a
            `title`, which is unreachable on touch and invisible to anyone
            scanning the table - the one moment it exists for. */}
        <FailureNote reason={order.jobCreationError} label="Job creation failed" className="mt-1" />
      </TableCell>
      {/* The customer's own date where Shopify gave one, falling back to when
          Tensor imported it. They are weeks apart on a backfill, and it is the
          customer's that matters when someone is chasing a late order. */}
      <TableCell className="text-muted-foreground py-2 text-xs whitespace-nowrap">
        {dateTime(order.placedAt ?? order.submittedAt)}
      </TableCell>
      <TableCell
        className={cn(
          'max-w-40 truncate py-2',
          order.customer ? undefined : 'text-muted-foreground',
        )}
      >
        {order.customer ?? '—'}
      </TableCell>
      <TableCell className="py-2 whitespace-nowrap" numeric>
        ₹{order.total.toLocaleString('en-IN')}
      </TableCell>
      <TableCell className="py-2" numeric>
        {itemCount > 0 ? itemCount : '—'}
      </TableCell>
      <TableCell className="py-2">
        <StatusCell value={order.fulfillmentStatus} />
      </TableCell>
      {/* Truncated rather than wrapped: the delivery method is the longest
          free-text column ("FREE DISPATCH - BEST DEAL"), and letting it wrap
          set the height of every row in the table. */}
      <TableCell className="text-muted-foreground max-w-44 truncate py-2 text-xs whitespace-nowrap">
        {order.shippingTitle ?? '—'}
      </TableCell>
      <TableCell className="py-2">
        <TonePill label={status.label} tone={status.tone} />
      </TableCell>
      <TableCell className="py-2">
        <StatusCell value={order.deliveryStatus} />
      </TableCell>
      <TableCell className="py-2">
        {order.tags.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex max-w-40 flex-nowrap items-center gap-1 overflow-hidden">
            {order.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="bg-surface-muted text-muted-foreground max-w-28 truncate rounded px-1.5 py-0.5 text-xs whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            {/* A count rather than a third chip: tags are free text and a long
                one would push every column after it off the screen. */}
            {order.tags.length > 2 ? (
              <span className="text-subtle-foreground text-xs">+{order.tags.length - 2}</span>
            ) : null}
          </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground py-2 text-xs whitespace-nowrap">
        {order.sourceName ?? '—'}
      </TableCell>
      <TableCell className="py-2">
        {/* "no_return" renders as a dash: Shopify states it on every order that
            was never sent back, and a "No return" pill on all 2,000 rows would
            be noise where the column only matters when it says otherwise. */}
        <StatusCell value={order.returnStatus} />
      </TableCell>
      <TableCell className="py-2 text-right">
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
