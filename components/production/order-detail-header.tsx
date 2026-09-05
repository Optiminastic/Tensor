import type { JSX } from 'react'

import { ORDER_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderRecord } from '@/components/production/types'
import { dateTime } from '@/lib/format'

/**
 * The order's identity line: number, payment and fulfilment state, and when the
 * customer placed it.
 *
 * The date is `placedAt` where Shopify gave one, falling back to the import
 * time. They are the same on a live sync and weeks apart on a backfill, and it
 * is the customer's date that matters when someone is chasing a late order.
 * Which one is being shown is labelled, so the two are never confused.
 */
interface OrderDetailHeaderProps {
  order: OrderRecord
}

export function OrderDetailHeader({ order }: OrderDetailHeaderProps): JSX.Element {
  const status = ORDER_STATUS_CONFIG[order.status]
  const unfulfilled = order.fulfillmentStatus !== 'fulfilled'
  const placed = order.placedAt !== null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-display text-3xl">{order.orderNumber}</h1>
        <TonePill label={status.label} tone={status.tone} />
        {order.fulfillmentStatus ? (
          <TonePill
            label={unfulfilled ? 'Unfulfilled' : 'Fulfilled'}
            tone={unfulfilled ? 'warning' : 'success'}
          />
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm">
        {placed ? 'Placed' : 'Imported'} {dateTime(order.placedAt ?? order.submittedAt)}
        {order.sourceName ? ` from ${order.sourceName}` : ''}
      </p>
    </div>
  )
}
