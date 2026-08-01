import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toOrderRecord } from '@/components/production/adapters'
import { OrdersTable } from '@/components/production/orders-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { OrderRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import { ProductionServiceError, listOrders } from '@/services/production.service'

export const metadata: Metadata = { title: 'Orders' }

interface ProductionOrdersPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionOrdersPage({
  params,
}: ProductionOrdersPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let orders: OrderRecord[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      orders = (await listOrders(token)).map(toOrderRecord)
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load orders.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader title="Orders" description="Orders feeding the production queue." />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <OrdersTable brand={brand} orders={orders} />
      )}
    </main>
  )
}
