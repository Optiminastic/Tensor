import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toOrderRecord } from '@/components/production/adapters'
import { OrdersLiveToggle } from '@/components/production/orders-live-toggle'
import { OrdersTable } from '@/components/production/orders-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { OrderRecord } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { ProductionServiceError, listOrders } from '@/services/production.service'

export const metadata: Metadata = { title: 'Orders' }

interface ProductionOrdersPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ live?: string }>
}

export default async function ProductionOrdersPage({
  params,
  searchParams,
}: ProductionOrdersPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)
  const live = (await searchParams).live === '1'

  let orders: OrderRecord[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      orders = (await listOrders(token, live ? 'live' : 'dummy')).map(toOrderRecord)
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load orders.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader
          title="Orders"
          description={
            live
              ? 'Real orders imported from Shopify via webhook.'
              : 'Sample orders for previewing the production queue.'
          }
        />
        <OrdersLiveToggle brand={brand} live={live} />
      </div>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : orders.length === 0 && live ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
          No live orders yet. Once Shopify sends an order webhook, it will show up here.
        </p>
      ) : (
        <OrdersTable brand={brand} orders={orders} />
      )}
    </main>
  )
}
