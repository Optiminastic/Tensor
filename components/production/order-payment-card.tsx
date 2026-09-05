import type { JSX } from 'react'

import { ORDER_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { inr, money } from '@/lib/format'

/**
 * The money summary, matching the store's own breakdown.
 *
 * Every figure comes from Shopify rather than being recomputed here. Tensor
 * does not know the store's tax, shipping or discount rules, and a subtotal
 * derived by multiplying line prices would eventually disagree with the
 * customer's receipt - at which point nobody could tell which was right.
 *
 * A row whose amount Shopify never stated is omitted entirely. Showing
 * "Discount ₹0.00" on an order that had no discount is noise; showing it on an
 * order whose discount we simply failed to import is a lie.
 */
interface OrderPaymentCardProps {
  order: OrderRecord
}

interface SummaryRowProps {
  label: string
  /** Secondary text Shopify puts in the middle column, e.g. the discount name. */
  detail?: string | null
  amount: string | null
  emphasis?: boolean
}

function SummaryRow({ label, detail, amount, emphasis }: SummaryRowProps): JSX.Element | null {
  if (amount === null) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className={emphasis ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
      {detail ? (
        <span className="text-muted-foreground min-w-0 flex-1 text-xs">{detail}</span>
      ) : null}
      <span className={`font-mono tabular-nums ${emphasis ? 'font-medium' : ''}`}>{amount}</span>
    </div>
  )
}

export function OrderPaymentCard({ order }: OrderPaymentCardProps): JSX.Element {
  const status = ORDER_STATUS_CONFIG[order.status]
  const itemCount = order.lineItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="pb-2">
        <TonePill label={status.label} tone={status.tone} />
      </div>

      <SummaryRow
        label="Subtotal"
        detail={itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : null}
        amount={money(order.subtotal)}
      />
      {/* Rendered negative, the way it reduces the bill. */}
      <SummaryRow
        label="Discount"
        detail={order.discountTitle}
        amount={money(order.totalDiscounts) ? `-${money(order.totalDiscounts)}` : null}
      />
      <SummaryRow
        label="Shipping"
        detail={order.shippingTitle}
        amount={money(order.totalShipping)}
      />

      <div className="border-border border-t">
        {/* total is a number rather than a Shopify decimal string - it is the
            one money field the orders table has always carried. */}
        <SummaryRow label="Total" amount={inr(order.total, 2)} emphasis />
      </div>
      <div className="border-border border-t">
        <SummaryRow label="Paid" amount={money(order.amountPaid)} />
      </div>
    </Card>
  )
}
