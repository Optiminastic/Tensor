import type { JSX } from 'react'

import { Stat } from '@/components/ui/stat'
import { PHONE_NUMBER_RUPEES_PER_MONTH, SARVAM_RUPEES_PER_MINUTE, rupees } from '@/lib/agent-costs'
import type { CallStats, MessageStats } from '@/lib/agent-overview'
import { duration } from '@/lib/call-format'

interface AgentStatRowProps {
  calls: CallStats
  messages: MessageStats
  /**
   * True when the message ledger could not be read.
   *
   * IT HAS TO REACH THIS TILE. When that request fails the page still
   * renders, with an empty message list behind it - so "WhatsApp sent"
   * showed a confident 0 next to a red banner, and 0 is a real number a
   * reader will believe. "No messages went out this week" and "we could not
   * find out" are different answers, and only one of them is cause to go
   * looking.
   */
  messagesUnavailable?: boolean
}

/** The agent's activity and spend for the period, as four tiles. */
export function AgentStatRow({
  calls,
  messages,
  messagesUnavailable = false,
}: AgentStatRowProps): JSX.Element {
  const connectRate = calls.placed > 0 ? Math.round((calls.connected / calls.placed) * 100) : 0
  const perCall = calls.placed > 0 ? calls.callCost / calls.placed : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat
        label="Calls placed"
        value={calls.placed}
        subCounts={[
          { label: 'Connected', value: `${calls.connected} · ${connectRate}%`, tone: 'success' },
          { label: 'Missed', value: calls.placed - calls.connected, tone: 'muted' },
        ]}
      />
      <Stat
        label="Talk time"
        value={`${calls.totalMinutes.toLocaleString('en-IN', { maximumFractionDigits: 1 })} min`}
        subCounts={[{ label: 'Avg connected call', value: duration(calls.averageSeconds) }]}
      />
      <Stat
        label="Agent spend"
        value={rupees(calls.totalCost)}
        subCounts={[{ label: 'Avg per call', value: rupees(perCall) }]}
        hint={`₹${SARVAM_RUPEES_PER_MINUTE.toFixed(2)}/min billed per second, plus the number's ₹${PHONE_NUMBER_RUPEES_PER_MONTH}/month`}
      />
      <Stat
        label="WhatsApp sent"
        value={messagesUnavailable ? '—' : messages.sent}
        subCounts={
          messagesUnavailable
            ? [{ label: 'Could not be read', value: 'see above', tone: 'warning' }]
            : [
                {
                  label: 'Failed',
                  value: messages.failed,
                  tone: messages.failed > 0 ? 'danger' : 'muted',
                },
                { label: 'Unfinished', value: messages.pending, tone: 'muted' },
              ]
        }
      />
    </div>
  )
}
