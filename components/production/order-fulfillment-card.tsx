import { ShoppingBag, Truck } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import { OrderLineProperties } from '@/components/production/order-line-properties'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderLineItem, OrderRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { money } from '@/lib/format'

/**
 * The order's line items, laid out the way the store's own admin lays them out.
 *
 * Deliberately not a table. Shopify stacks each line as a block - thumbnail,
 * name, variant, SKU on the left; price, quantity and total on the right; the
 * customer's answers underneath - and an operator cross-checking Tensor against
 * Shopify should be reading the same shape in both. A table forced the
 * personalisation into one overloaded cell.
 */
interface OrderFulfillmentCardProps {
  order: OrderRecord
}

function ProductThumb({ url, alt }: { url: string | null; alt: string }): JSX.Element {
  if (!url) {
    return (
      <div className="border-border bg-surface-muted text-subtle-foreground flex size-12 shrink-0 items-center justify-center rounded-md border">
        <ShoppingBag className="size-5" aria-hidden />
      </div>
    )
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={48}
      height={48}
      unoptimized
      className="border-border size-12 shrink-0 rounded-md border object-cover"
    />
  )
}

/**
 * The price column: what was charged, with the pre-discount figure struck
 * through beside it when the two differ.
 *
 * The strike-through only appears on a real discount. Rendering it whenever a
 * unit price exists would put a line through the full price of every
 * undiscounted item, which reads as a markdown that never happened.
 */
function LinePrice({ item }: { item: OrderLineItem }): JSX.Element {
  const charged = money(item.discountedUnitPrice) ?? money(item.unitPrice)
  const original = money(item.unitPrice)
  const discounted = original !== null && charged !== null && original !== charged

  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="flex flex-col items-end">
        <span className="font-mono tabular-nums">{charged ?? '—'}</span>
        {discounted ? (
          <span className="text-subtle-foreground font-mono text-xs tabular-nums line-through">
            {original}
          </span>
        ) : null}
      </div>
      <span className="text-muted-foreground pt-0.5">×</span>
      <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-xs tabular-nums">
        {item.quantity}
      </span>
      <span className="w-20 pt-0.5 text-right font-mono tabular-nums">
        {money(item.lineTotal) ?? '—'}
      </span>
    </div>
  )
}

export function OrderFulfillmentCard({ order }: OrderFulfillmentCardProps): JSX.Element {
  const unfulfilled = order.fulfillmentStatus !== 'fulfilled'
  const itemCount = order.lineItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <TonePill
          label={unfulfilled ? `Unfulfilled (${itemCount})` : 'Fulfilled'}
          tone={unfulfilled ? 'warning' : 'success'}
        />
      </div>

      {order.shippingTitle ? (
        <div className="border-border text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Truck className="size-4 shrink-0" aria-hidden />
          <span>{order.shippingTitle}</span>
        </div>
      ) : null}

      {order.lineItems.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
          This order has no line items. Press Sync to pull it from Shopify again.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {order.lineItems.map((item, i) => (
            // Indexed: two lines of the same product in different variants are
            // a normal order, and they share every other identifier.
            <li
              key={`${item.sku ?? item.name}-${i}`}
              className="border-border rounded-md border p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <ProductThumb url={item.imageUrl} alt={item.name} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.variantTitle ? (
                        <span className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                          {item.variantTitle}
                        </span>
                      ) : null}
                      {item.sku ? (
                        <span className="text-subtle-foreground font-mono text-xs">{item.sku}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <LinePrice item={item} />
              </div>
              <OrderLineProperties properties={item.properties} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
