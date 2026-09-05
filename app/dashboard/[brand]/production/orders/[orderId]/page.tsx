import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { toOrderDetailRecord, toOrderJobPersonalisation } from '@/components/production/adapters'
import { OrderDetailHeader } from '@/components/production/order-detail-header'
import { OrderDetailView } from '@/components/production/order-detail-view'
import type { OrderJobPersonalisation, OrderRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import { getOrder, listProductionJobsForOrder } from '@/services/production.service'

export const metadata: Metadata = { title: 'Order' }

interface OrderPageProps {
  params: Promise<{ brand: string; orderId: string }>
}

export default async function OrderPage({ params }: OrderPageProps): Promise<JSX.Element> {
  const { brand, orderId } = await params
  const { token } = await resolveBackendToken()
  if (!token) notFound()

  let order: OrderRecord
  let jobs: OrderJobPersonalisation[]
  try {
    order = toOrderDetailRecord(await getOrder(token, orderId))
    jobs = (await listProductionJobsForOrder(token, orderId)).map(toOrderJobPersonalisation)
  } catch {
    notFound()
  }

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${brand}/production/orders`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Orders
        </Link>
        <OrderDetailHeader order={order} />
      </div>
      <OrderDetailView brand={brand} order={order} jobs={jobs} />
    </main>
  )
}
