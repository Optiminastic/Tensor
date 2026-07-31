import type { JSX } from 'react'

import { OrderLineItemsTable } from '@/components/production/order-line-items-table'
import { OrderSummaryCard } from '@/components/production/order-summary-card'
import type { OrderRecord } from '@/components/production/types'

interface OrderDetailViewProps {
  order: OrderRecord
}

export function OrderDetailView({ order }: OrderDetailViewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <OrderSummaryCard order={order} />
      <OrderLineItemsTable lineItems={order.lineItems} />
    </div>
  )
}
