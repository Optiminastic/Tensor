import type { Metadata } from 'next'
import type { JSX } from 'react'

import { LogsTabs } from '@/components/agent/logs-tabs'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageLog } from '@/lib/validators/message-logs'
import { listCallLogs } from '@/services/call-logs.service'
import { listMessageLogs } from '@/services/message-logs.service'

export const metadata: Metadata = { title: 'Logs' }

export const dynamic = 'force-dynamic'

interface LogsPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Everything the win-back agent did about an abandoned cart: the call and the
 * message, on two tabs.
 *
 * TWO SOURCES, read independently. Calls come from Sarvam's analytics API,
 * which is the system of record for what happened on a phone call. Messages
 * come from Tensor's own ledger, because without a delivery webhook Meta has
 * nothing to add to what was recorded at send time.
 *
 * They are fetched side by side and their failures are kept apart: Sarvam
 * being unreachable must not blank the message log, which is the one that
 * needs no upstream at all.
 */
export default async function LogsPage({ params }: LogsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)

  let calls: CallLog[] = []
  let messages: MessageLog[] = []
  let callsError: string | null = null
  let messagesError: string | null = null

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    const expired = tokenError ?? 'Your session has expired. Sign in again.'
    callsError = expired
    messagesError = expired
  } else {
    const [callResult, messageResult] = await Promise.allSettled([
      listCallLogs(token, brand),
      listMessageLogs(token, brand),
    ])
    if (callResult.status === 'fulfilled') {
      calls = callResult.value
    } else {
      callsError = describe(callResult.reason, 'Could not load the call logs.')
    }
    if (messageResult.status === 'fulfilled') {
      messages = messageResult.value
    } else {
      messagesError = describe(messageResult.reason, 'Could not load the message logs.')
    }
  }

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 md:px-8">
      <ProductionPageHeader
        title="Logs"
        description="Every call and message the agent sent about an abandoned cart."
      />
      <LogsTabs
        brand={brand}
        calls={calls}
        callsError={callsError}
        messages={messages}
        messagesError={messagesError}
      />
    </main>
  )
}

/** The upstream's own sentence where there is one - its refusals name the fix. */
function describe(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}
