import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ProductionPageHeader } from '@/components/production/production-page-header'
import { DeliveriesView } from '@/components/shipping/deliveries-view'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ShipmentsResponse } from '@/lib/validators/shipments'
import { listShipments } from '@/services/shipments.service'

export const metadata: Metadata = { title: 'Deliveries' }

export const dynamic = 'force-dynamic'

interface DeliveriesPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Every parcel the store has shipped, and what the courier did with it.
 *
 * WHY IT IS ASSEMBLED AND NOT FETCHED. Delhivery cannot be asked which
 * shipments are stuck - its tracking endpoint answers "parameter
 * ref_ids/ref_nos or waybill is required" with or without a status filter, and
 * its NDR paths return a login page rather than JSON. So Tensor reads the
 * waybills from Shopify's fulfilments, tracks them against Delhivery fifty at
 * a time, and classifies the carrier's own sentence. All of that is the
 * backend's work; this page renders it.
 *
 * THE WHOLE WINDOW COMES DOWN AT ONCE and the filtering happens in the
 * browser. The backend assembles and caches the complete picture anyway, so
 * narrowing by reason is a local operation over data that is already here -
 * and making it a round trip per tab is what rate-limited us at the carrier
 * the first time.
 *
 * READ ON DEMAND, NOT STORED, like the Abandoned Checkouts page beside it.
 * There is no Tensor-side state here yet - nothing marks a delivery as chased
 * - so a table and a poller would buy staleness for nothing. The day this page
 * grows a "called back" column is the day it earns storage.
 */
export default async function DeliveriesPage({
  params,
}: DeliveriesPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)

  let data: ShipmentsResponse | null = null
  let error: string | null = null

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      data = await listShipments(token, brand)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not load the deliveries.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 md:px-8">
      <ProductionPageHeader
        title="Deliveries"
        description="Every parcel Delhivery is carrying for this brand, with the ones nobody could take at the top."
      />

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : data === null ? null : (
        <DeliveriesView data={data} />
      )}
    </main>
  )
}
