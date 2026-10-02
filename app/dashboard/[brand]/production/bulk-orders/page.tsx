import type { Metadata } from 'next'
import type { JSX } from 'react'

import { BulkOrdersPanel } from '@/components/production/bulk-orders-panel'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { BulkOrder, SellableSku } from '@/lib/validators/bulk-orders'
import {
  BulkOrderServiceError,
  listBulkOrders,
  listSellableSkus,
} from '@/services/bulk-orders.service'

export const metadata: Metadata = { title: 'Bulk Orders' }

export const dynamic = 'force-dynamic'

interface BulkOrdersPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Bulk orders: a business asks for a hundred planks, the shop answers with a
 * quotation.
 *
 * ADMIN ONLY, on bulk_order:read - the same key that puts it in the nav. It was
 * pricing:read first, which a Project Lead and a Performance Marketer also
 * hold, so the page was visible to three roles rather than one. Bulk orders
 * carry negotiated prices and can put a hundred jobs on the floor from one
 * upload.
 *
 * The SKU list and its prices are fetched here rather than in the dialog so the
 * form opens already populated: the price list is a Shopify round trip, and
 * doing it on click would mean an empty dropdown for a second every time.
 */
export default async function BulkOrdersPage({
  params,
}: BulkOrdersPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('bulk_order:read', `/dashboard/${brand}`)

  let orders: BulkOrder[] = []
  let skus: SellableSku[] = []
  let error: string | null = null
  let skuError: string | null = null

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    // Settled independently: a Shopify outage costs the price list, and the
    // quotations already written must still be readable without it.
    const [orderResult, skuResult] = await Promise.allSettled([
      listBulkOrders(token, brand),
      listSellableSkus(token, brand),
    ])
    if (orderResult.status === 'fulfilled') {
      orders = orderResult.value
    } else {
      error =
        orderResult.reason instanceof BulkOrderServiceError
          ? orderResult.reason.message
          : 'Could not load bulk orders.'
    }
    if (skuResult.status === 'fulfilled') {
      skus = skuResult.value
    } else {
      skuError =
        skuResult.reason instanceof BulkOrderServiceError
          ? skuResult.reason.message
          : 'Could not load products and prices.'
    }
  }

  return (
    <BulkOrdersPanel
      brand={brand}
      orders={orders}
      skus={skus}
      loadError={error}
      skuError={skuError}
    />
  )
}
