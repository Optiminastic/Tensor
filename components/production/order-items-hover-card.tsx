'use client'

import { useState, type JSX, type ReactNode } from 'react'

import { orderLineItemsAction } from '@/app/dashboard/[brand]/production/order-actions'
import { OrderLineProperties } from '@/components/production/order-line-properties'
import type { OrderLineItem } from '@/components/production/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

interface OrderItemsHoverCardProps {
  orderId: string
  orderNumber: string
  /** How many units the list already knows about, shown while the lines load. */
  itemCount: number | null
  children: ReactNode
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; items: OrderLineItem[] }
  | { status: 'failed'; error: string }

/**
 * What is actually on an order, without opening it.
 *
 * The orders table shows "2 items" and a customer name, which is not enough to
 * answer the question people actually have at this screen: what did they order
 * and what did they type into it. Opening each order to find out is three
 * clicks and a lost place in the list.
 *
 * Fetched on first hover, never with the page. The list response deliberately
 * omits the line_items document, and shipping every attribute of every line for
 * a whole page of orders - to fill cards nobody may open - is exactly the cost
 * that decision avoids. Once fetched it is kept, so moving back along a row
 * does not re-request.
 *
 * Properties are rendered by the same component the order page uses, so the
 * card and the page cannot drift about what a line says.
 */
export function OrderItemsHoverCard({
  orderId,
  orderNumber,
  itemCount,
  children,
}: OrderItemsHoverCardProps): JSX.Element {
  const [state, setState] = useState<State>({ status: 'idle' })

  async function load(): Promise<void> {
    // Only ever once per row. A failure is kept too rather than retried on
    // every pass of the cursor, which would hammer a backend that is already
    // struggling.
    if (state.status !== 'idle') return
    setState({ status: 'loading' })
    const res = await orderLineItemsAction(orderId)
    setState(
      res.ok
        ? { status: 'ready', items: res.data ?? [] }
        : { status: 'failed', error: res.error ?? 'Could not load this order.' },
    )
  }

  return (
    <HoverCard openDelay={250} closeDelay={100} onOpenChange={open => open && void load()}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="max-h-96 w-96 overflow-y-auto" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-xs font-medium">{orderNumber}</span>
            {itemCount !== null ? (
              <span className="text-muted-foreground text-xs">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            ) : null}
          </div>

          {state.status === 'loading' || state.status === 'idle' ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : null}

          {state.status === 'failed' ? <p className="text-danger text-sm">{state.error}</p> : null}

          {state.status === 'ready' && state.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">This order has no line items.</p>
          ) : null}

          {state.status === 'ready'
            ? state.items.map((item, i) => (
                // Indexed: a store may sell the same SKU twice on one order as
                // separate lines with different personalisation, and keying on
                // the SKU would collapse them into one.
                <div
                  key={`${item.sku ?? item.name}-${i}`}
                  className="border-border flex flex-col border-t pt-2 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.quantity > 1 ? (
                      <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                        × {item.quantity}
                      </span>
                    ) : null}
                  </div>
                  {/* The variant is the colour and light option - the two things
                      that decide which filament goes in and what gets packed. */}
                  {item.variantTitle ? (
                    <span className="text-muted-foreground text-xs">{item.variantTitle}</span>
                  ) : null}
                  <OrderLineProperties properties={item.properties} />
                </div>
              ))
            : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
