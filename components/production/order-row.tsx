'use client'

import { AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent, type MouseEvent } from 'react'

import { createJobsFromOrder } from '@/app/dashboard/[brand]/production/actions'
import { FailureNote, failureRowClass } from '@/components/production/failure-note'
import { OrderItemsHoverCard } from '@/components/production/order-items-hover-card'
import { isPriorityShipping } from '@/components/production/priority'
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
          {/* Hovering the number previews what is on the order. The number is
              the trigger rather than the whole row: a row-wide hover fires
              while the cursor is only crossing the table on its way somewhere
              else, and a card that appears unbidden over the next row is worse
              than no card. */}
          <OrderItemsHoverCard
            orderId={order.id}
            orderNumber={order.orderNumber}
            itemCount={order.itemCount}
          >
            {/* A real anchor, so the browser's own openings work: ctrl/cmd
                click, middle click, and "Open link in new tab". The row's
                click handler stays for the convenience of clicking anywhere,
                but it must not also fire here or a ctrl-click would open the
                order in a new tab AND navigate this one.

                prefetch={false} on purpose: a page of fifty orders would
                otherwise prefetch fifty order-detail routes, each re-running
                the layout chain on the server - the same round-trip
                multiplication that made these pages slow. */}
            <Link
              href={href}
              prefetch={false}
              onClick={stopRowClick}
              className="underline-offset-4 hover:underline"
            >
              {order.orderNumber}
            </Link>
          </OrderItemsHoverCard>
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
      {/* The SKU, beside the order number where the eye already is.
          It is the only thing that says WHICH product a line is precisely
          enough to act on: the storefront renames products freely and several
          read almost alike - "Dual Name Plank", "PREMIUM DUAL NAME PLANK" and
          "Dual Name Plank with Light" are three products, three templates and
          three prices. DNP-BLU, PDNP-BLU and DNPWL-BLU are not.

          A mixed order carries several, so the first is shown with a count of
          the rest rather than a list that would widen the column past every
          other row. The title attribute carries them all. */}
      <TableCell className="py-2 font-mono text-xs whitespace-nowrap" title={order.skus.join(', ')}>
        {order.skus.length === 0 ? (
          <span className="text-subtle-foreground">&mdash;</span>
        ) : (
          <>
            {order.skus[0]}
            {order.skus.length > 1 ? (
              <span className="text-subtle-foreground"> +{order.skus.length - 1}</span>
            ) : null}
          </>
        )}
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
      {/* A paid priority upgrade is a promise to the customer AND the reason
          this order is batched ahead of the ones placed before it, so it reads
          as a badge rather than as one more line of grey free text. */}
      <TableCell className="max-w-44 py-2 text-xs whitespace-nowrap">
        {isPriorityShipping(order.shippingTitle) ? (
          <TonePill label="Priority" tone="danger" />
        ) : (
          <span className="text-muted-foreground block truncate">{order.shippingTitle ?? '—'}</span>
        )}
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
