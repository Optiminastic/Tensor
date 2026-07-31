import type { Metadata } from 'next'
import type { JSX } from 'react'

import { OrdersTable } from '@/components/production/orders-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { ORDERS } from '@/components/production/sample-data'

export const metadata: Metadata = { title: 'Orders' }

interface ProductionOrdersPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionOrdersPage({
  params,
}: ProductionOrdersPageProps): Promise<JSX.Element> {
  const { brand } = await params

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader title="Orders" description="Orders feeding the production queue." />
      <OrdersTable brand={brand} orders={ORDERS} />
    </main>
  )
}
