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
import { type AgentData, NO_AGENT_DATA, loadAgentData } from '@/services/agent-data.service'
import { getVoiceStatus } from '@/services/voice-calls.service'

export const metadata: Metadata = { title: 'Abandoned Checkouts' }

export const dynamic = 'force-dynamic'

interface AbandonedCheckoutPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Checkouts a customer started and walked away from, live from Shopify, with
 * everything the win-back agent did about each one in its drawer.
 *
 * Nothing is stored for the checkouts themselves. There is no state to keep
 * yet - no row is marked handled - so a table and a sync job would buy
 * staleness and a migration for nothing.
 *
 * FOUR SOURCES, read side by side and failing apart. The checkouts are
 * Shopify's; the calls are Sarvam's analytics API; the messages are Tensor's
 * own ledger; the template is Meta's. Sarvam being unreachable must not take
 * the list down with it - the list is worth reading even when the transcripts
 * are not there.
 */
export default async function AbandonedCheckoutPage({
  params,
}: AbandonedCheckoutPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)

  let checkouts: AbandonedCheckout[] = []
  let attribution: Record<string, string> = {}
  let error: string | null = null
  // Asked up front so a Call button is never offered that cannot work.
  let callingEnabled = false
  let agent: AgentData = NO_AGENT_DATA

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    const [response, voice, agentData] = await Promise.all([
      listAbandonedCheckouts(token, brand).then(
        ok => ok,
        (err: unknown) =>
          err instanceof AbandonedCheckoutsServiceError
            ? err.message
            : 'Could not load abandoned checkouts.',
      ),
      // A failure here must not take the table down: the list is worth
      // reading even when nobody can be rung.
      getVoiceStatus(token).catch(() => null),
      loadAgentData(token, brand),
    ])
    agent = agentData
    callingEnabled = voice?.configured ?? false
    if (typeof response === 'string') error = response
    else {
      checkouts = response.items
      // Absent from a Tensor-Core that predates it; the table then
      // simply shows no arrow rather than a wrong one.
      attribution = response.attribution ?? {}
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <ProductionPageHeader
        eyebrow="Agent"
        title="Abandoned Checkouts"
        description="Baskets a customer started and did not finish, from the last 30 days. Open one for its details, the agent's call and the messages sent."
      />

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : checkouts.length === 0 ? (
        // Shopify only records a checkout as abandoned once the customer
        // entered contact details, so an empty list is the normal state for a
        // quiet day rather than a broken page.
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
          No abandoned checkouts in the last 30 days. Shopify only records one once the customer has
          entered their contact details.
        </p>
      ) : (
        <AbandonedCheckoutsTable
          checkouts={checkouts}
          attribution={attribution}
          agent={{ calls: agent.calls, messages: agent.messages }}
          context={{ brand, errors: agent.errors, template: agent.template, callingEnabled }}
        />
      )}
    </main>
  )
}
