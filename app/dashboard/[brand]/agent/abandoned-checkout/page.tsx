import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AbandonedCheckoutsTable } from '@/components/agent/abandoned-checkouts-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'
import {
  AbandonedCheckoutsServiceError,
  listAbandonedCheckouts,
} from '@/services/abandoned-checkouts.service'
import { getVoiceStatus } from '@/services/voice-calls.service'

export const metadata: Metadata = { title: 'Abandoned Checkouts' }

interface AbandonedCheckoutPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Checkouts a customer started and walked away from, live from Shopify.
 *
 * Nothing is stored. There is no state to keep yet - no row is marked handled
 * or recovered - so a table and a sync job would buy staleness and a migration
 * for nothing. The day this page grows a "contacted" column is the day it earns
 * storage.
 */
export default async function AbandonedCheckoutPage({
  params,
}: AbandonedCheckoutPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)

  let checkouts: AbandonedCheckout[] = []
  let error: string | null = null
  // Asked up front so a Call button is never offered that cannot work. An
  // unconfigured backend is a setup problem with a known fix, and finding it
  // out by ringing a customer is the wrong way round.
  let callingEnabled = false

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      const [response, voice] = await Promise.all([
        listAbandonedCheckouts(token, brand),
        // A failure here must not take the table down with it: the list is
        // worth reading even when nobody can be rung.
        getVoiceStatus(token).catch(() => null),
      ])
      checkouts = response.items
      callingEnabled = voice?.configured ?? false
    } catch (err) {
      error =
        err instanceof AbandonedCheckoutsServiceError
          ? err.message
          : 'Could not load abandoned checkouts.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader
          title="Abandoned Checkouts"
          description="Baskets a customer started and did not finish, from the last 30 days."
        />
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : checkouts.length === 0 ? (
        // Worth saying WHY it can be empty. Shopify only records a checkout as
        // abandoned once the customer entered contact details, so an empty list
        // is the normal state for a quiet day rather than a broken page.
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
          No abandoned checkouts in the last 30 days. Shopify only records one once the customer has
          entered their contact details.
        </p>
      ) : (
        <AbandonedCheckoutsTable checkouts={checkouts} callingEnabled={callingEnabled} />
      )}
    </main>
  )
}
