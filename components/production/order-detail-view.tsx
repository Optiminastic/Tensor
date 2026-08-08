import type { JSX } from 'react'

import { OrderLineItemsTable } from '@/components/production/order-line-items-table'
import { OrderPersonalisationLog } from '@/components/production/order-personalisation-log'
import { OrderSummaryCard } from '@/components/production/order-summary-card'
import type { OrderJobPersonalisation, OrderRecord } from '@/components/production/types'

interface OrderDetailViewProps {
  brand: string
  order: OrderRecord
  jobs: OrderJobPersonalisation[]
}

export function OrderDetailView({ brand, order, jobs }: OrderDetailViewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <OrderSummaryCard order={order} />
      <OrderLineItemsTable products={order.products} lineItems={order.lineItems} />
      <OrderPersonalisationLog brand={brand} jobs={jobs} />
    </div>
  )
}
