import { toOrderDetailRecord, toOrderJobPersonalisation } from '@/components/production/adapters'
import type { OrderJobPersonalisation, OrderRecord } from '@/components/production/types'
import {
  OrderPersonalisationSchema,
  type OrderPersonalisation,
} from '@/lib/validators/order-personalisation'
import { OrderDetailSchema, ProductionJobSchema } from '@/lib/validators/production'

/**
 * The order drawer's data, fetched when it opens.
 *
 * Through the app's own proxy rather than straight from Tensor-Core: this runs
 * in the browser and the backend token belongs to the server.
 */

export interface OrderDrawerDetail {
  order: OrderRecord
  jobs: OrderJobPersonalisation[]
}

/** One order and its jobs. */
export async function fetchOrderDetail(orderId: string): Promise<OrderDrawerDetail> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/detail`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  const body: unknown = await response.json()
  const parsed = body as { order: unknown; jobs: unknown }
  return {
    order: toOrderDetailRecord(OrderDetailSchema.parse(parsed.order)),
    jobs: ProductionJobSchema.array().parse(parsed.jobs).map(toOrderJobPersonalisation),
  }
}

/** What the customer was asked, and what they changed. */
export async function fetchOrderPersonalisation(orderId: string): Promise<OrderPersonalisation> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/personalisation`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return OrderPersonalisationSchema.parse(await response.json())
}
