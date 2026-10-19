'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { JSX, KeyboardEvent, MouseEvent } from 'react'

import { FailureNote, failureRowClass } from '@/components/production/failure-note'
import { OrderItemsHoverCard } from '@/components/production/order-items-hover-card'
import { isPriorityShipping } from '@/components/production/priority'
import { shopifyStatusConfig } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderRecord } from '@/components/production/types'
import { TableCell, TableRow } from '@/components/ui/table'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface OrderRowProps {
  brand: string
  order: OrderRecord
  /** Opens the drawer over the table. */
  onOpen: () => void
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

/**
 * The customer's thirty minutes, as one cell.
 *
 * A LINK WHILE IT IS OPEN, a tag once it is not. The link is a real anchor to
 * a route that redirects, not a button that fetches and then opens: a tab
 * opened after an await is a popup as far as the browser is concerned and
 * gets blocked. It also means ctrl-click and "open in new tab" behave.
 *
 * The href is the ORDER, never the token. The token is unsealed server-side
 * for the one order somebody actually clicks, so a page of fifty orders does
 * not put fifty live customer links into a response and a browser cache.
 */
function PersonalisationCell({ order }: { order: OrderRecord }): JSX.Element {
  if (order.personalisation === 'open') {
    return (
      <a
        href={`/api/orders/${order.id}/personalisation-link`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stopRowClick}
        className="text-accent inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
      >
        Open link
        <ExternalLink className="size-3" aria-hidden />
      </a>
    )
  }
  if (order.personalisation === 'done') {
    return <TonePill label="Done" tone="success" />
  }
  if (order.personalisation === 'not_sent') {
    // Not "Done". Nobody asked this customer anything, and a row that implies
    // they were checked is how an order gets printed on unconfirmed values.
    return <TonePill label="Not sent" tone="warning" />
  }
  // STILL A DASH, now one that can answer for itself.
  //
  // The glyph is deliberate: on a page where almost every row predates the
  // feature, a pill on each of them would be noise, and the operator reading
  // this column is looking for the handful that are not dashes. But a dash
  // that means six different things is the reason somebody asks "why is this
  // one empty?" and nobody can say - so where Tensor recorded the rule, the
  // dash carries it on hover and the drawer prints it in full.
  if (order.personalisationSkipReason) {
    return (
      <span
        title={order.personalisationSkipReason}
        className="text-muted-foreground decoration-muted-foreground/40 cursor-help underline decoration-dotted underline-offset-4"
      >
        —
      </span>
    )
  }
  return <span className="text-muted-foreground">—</span>
}

export function OrderRow({ brand, order, onOpen }: OrderRowProps): JSX.Element {
  // From the backend: the list response carries a count rather than the line
  // items themselves, so counting them here would give zero on every row.
  const itemCount = order.itemCount
  const href = `/dashboard/${brand}/production/orders/${order.id}`

  // THE DRAWER, NOT THE PAGE. Opening an order used to leave the table, and
  // coming back lost the filter, the search, the period and the page somebody
  // had set to find it.
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') onOpen()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={onOpen}
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
      <TableCell className="py-2 whitespace-nowrap">
        <PersonalisationCell order={order} />
      </TableCell>
      <TableCell className="py-2">
        <StatusCell value={order.fulfillmentStatus} />
      </TableCell>
      {/* Truncated rather than wrapped: the delivery method is the longest
          free-text column ("FREE DISPATCH - BEST DEAL"), and letting it wrap
          set the height of every row in the table. */}
      {/* A paid priority upgrade is a promise to the customer, so it reads as a
          badge rather than as one more line of grey free text.
          It is no longer a scheduling claim: batching is first come, first
          served, and this order is grouped, locked and sent in its turn like
          any other. The badge is for whoever packs the parcel. */}
      <TableCell className="max-w-44 py-2 text-xs whitespace-nowrap">
        {isPriorityShipping(order.shippingTitle) ? (
          <TonePill label="Priority" tone="danger" />
        ) : (
          <span className="text-muted-foreground block truncate">{order.shippingTitle ?? '—'}</span>
        )}
      </TableCell>
      <TableCell className="py-2">
        <StatusCell value={order.deliveryStatus} />
      </TableCell>
      <TableCell className="py-2">
        {/* "no_return" renders as a dash: Shopify states it on every order that
            was never sent back, and a "No return" pill on all 2,000 rows would
            be noise where the column only matters when it says otherwise. */}
        <StatusCell value={order.returnStatus} />
      </TableCell>
    </TableRow>
  )
}
