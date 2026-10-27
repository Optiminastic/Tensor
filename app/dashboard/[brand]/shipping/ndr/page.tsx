import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ProductionPageHeader } from '@/components/production/production-page-header'
import { DelhiveryLink, ExceptionsView } from '@/components/shipping/exceptions-view'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ShipmentExceptionsResponse } from '@/lib/validators/shipment-exceptions'
import {
  ShipmentExceptionsServiceError,
  listShipmentExceptions,
} from '@/services/shipment-exceptions.service'

export const metadata: Metadata = { title: 'NDR' }

export const dynamic = 'force-dynamic'

interface NdrPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Delhivery's exception queue, mirrored.
 *
 * THIS READS DELHIVERY ONE, NOT THE TRACKING API. It used to read tracking and
 * classify the status codes here, and the two screens disagreed: Tensor listed
 * three parcels as stuck (rescheduled by the customer, not attempted, found in
 * a warehouse audit) while Delhivery's Need Action tab was empty - because
 * Delhivery had already booked an appointment for the first and owned the other
 * two itself. The words "Need Action", "Auto Reattempt" and "Return
 * Recommendation" are Delhivery's and exist only in their API, so they are read
 * from it rather than guessed from a scan code.
 *
 * ACTING NEEDS dispatch:manage, which reading does not. The buttons here send a
 * van out again or give up on a parcel and start it home - that is the shop
 * spending money and breaking a promise, not looking something up. Whoever
 * lacks it sees the queue and no buttons.
 */
export default async function NdrPage({ params }: NdrPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)
  const canAct = can(await currentAuthz(), 'dispatch:manage')

  let data: ShipmentExceptionsResponse | null = null
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      data = await listShipmentExceptions(token, brand)
    } catch (err) {
      error =
        err instanceof ShipmentExceptionsServiceError
          ? err.message
          : 'Could not reach the courier just now.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 md:px-8">
      <ProductionPageHeader
        eyebrow="Shipping"
        title="NDR"
        description="Delhivery's own exception queue, with their tabs and their buttons. Need Action is the only one waiting on us — the other two are Delhivery's own work, shown so nobody chases a parcel they do not own."
      />
      {error || !data ? (
        <p className="text-danger text-sm" role="alert">
          {error ?? 'Could not load the queue.'}
        </p>
      ) : (
        <>
          <ExceptionsView brand={brand} data={data} canAct={canAct} />
          <DelhiveryLink />
        </>
      )}
    </main>
  )
}
