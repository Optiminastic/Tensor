import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toOrderRecord } from '@/components/production/adapters'
import { OrdersSyncButton } from '@/components/production/orders-sync-button'
import { OrdersTable } from '@/components/production/orders-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { OrderRecord } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { listConnections } from '@/services/connections.service'
import { ProductionServiceError, listOrders } from '@/services/production.service'

// Whether this brand's Shopify connection (the same one the create-brand
// OAuth flow set up - see app/dashboard/[brand]/integrations/page.tsx for the
// same lookup) is connected, so the live toggle knows whether an on-demand
// sync is even possible. Any lookup failure defaults to false - UX only, no
// need to error out just because the toggle can't confirm this.
async function resolveShopifyConnected(token: string, brand: string): Promise<boolean> {
  try {
    const connections = await listConnections(token, brand)
    return connections.some(c => c.provider === 'shopify' && c.status === 'connected')
  } catch {
    return false
  }
}

export const metadata: Metadata = { title: 'Orders' }

interface ProductionOrdersPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionOrdersPage({
  params,
}: ProductionOrdersPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)

  let orders: OrderRecord[] = []
  let error: string | null = null
  let shopifyConnected = false
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      // Always the real thing. The seeded sample orders are still in the
      // database and still reachable by id, they are simply not what this
      // page is for - an order list that might be showing fabricated rows is
      // worse than an empty one, because nothing on screen says which it is.
      orders = (await listOrders(token, 'live')).map(toOrderRecord)
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load orders.'
    }
    shopifyConnected = await resolveShopifyConnected(token, brand)
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader title="Orders" description="Real orders imported from Shopify." />
        <OrdersSyncButton brand={brand} shopifyConnected={shopifyConnected} />
      </div>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
          No live orders yet. Click Sync from Shopify to pull in the latest orders.
        </p>
      ) : (
        <OrdersTable brand={brand} orders={orders} />
      )}
    </main>
  )
}
