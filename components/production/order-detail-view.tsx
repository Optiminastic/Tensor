import type { JSX } from 'react'

import { OrderDetailAside } from '@/components/production/order-detail-aside'
import { OrderFulfillmentCard } from '@/components/production/order-fulfillment-card'
import { OrderPaymentCard } from '@/components/production/order-payment-card'
import { OrderPersonalisationLog } from '@/components/production/order-personalisation-log'
import type { OrderJobPersonalisation, OrderRecord } from '@/components/production/types'

/**
 * The order, laid out the way the store's own admin lays it out: what was
 * ordered and what was paid down the main column, context down the side.
 *
 * The layout is copied on purpose. An operator works with Tensor and Shopify
 * open together, and matching the arrangement means they can compare the two
 * without re-finding every figure. The personalisation log stays at the
 * bottom - it is Tensor's own record, not something Shopify has.
 */
interface OrderDetailViewProps {
  brand: string
  order: OrderRecord
  jobs: OrderJobPersonalisation[]
}

export function OrderDetailView({ brand, order, jobs }: OrderDetailViewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <OrderFulfillmentCard order={order} />
          <OrderPaymentCard order={order} />
        </div>
        <OrderDetailAside order={order} />
      </div>
      <OrderPersonalisationLog brand={brand} jobs={jobs} />
    </div>
  )
}
