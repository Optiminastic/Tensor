import type { JSX } from 'react'

import { DetailField } from '@/components/production/detail-field'
import { ORDER_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface OrderSummaryCardProps {
  order: OrderRecord
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps): JSX.Element {
  const status = ORDER_STATUS_CONFIG[order.status]

  return (
    <Card>
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-foreground text-base font-semibold">{order.orderNumber}</span>
          <p className="text-muted-foreground text-xs">Submitted {order.submittedAt}</p>
        </div>
        <TonePill label={status.label} tone={status.tone} />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 md:grid-cols-4">
        <DetailField label="Store" value={order.store} />
        <DetailField label="Customer" value={order.customer ?? '—'} />
        <DetailField label="Customer ID" value={order.shopifyCustomerId ?? '—'} mono />
        <DetailField label="Total" value={`₹${order.total.toLocaleString('en-IN')}`} mono />
        <DetailField label="Email" value={order.customerEmail ?? '—'} />
        <DetailField label="Phone" value={order.customerPhone ?? '—'} mono />
        <DetailField label="Items" value={order.products.length || order.lineItems.length} mono />
      </div>
    </Card>
  )
}
