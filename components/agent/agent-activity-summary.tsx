import { ChevronDown } from 'lucide-react'
import type { JSX } from 'react'

import { CallFacts } from '@/components/agent/call-parts'
import { when } from '@/components/agent/sent-message'
import { Badge } from '@/components/ui/badge'
import type { CheckoutActivity } from '@/lib/checkout-format'

/** Why a half of the activity could not be read; null when it was. */
export interface ActivityErrors {
  calls: string | null
  messages: string | null
}

interface AgentActivitySummaryProps {
  activity: CheckoutActivity
  errors: ActivityErrors
}

/**
 * What the Sarvam agent did about this checkout, folded under the Shopify
 * details.
 *
 * The latest call in full - its outcome, how it ended, the agent's own summary
 * - and the latest message in a line. Earlier attempts are on the Transcript
 * and Message log tabs; the overview answers "where does this stand", and the
 * last attempt is what decides that.
 */
export function AgentActivitySummary({ activity, errors }: AgentActivitySummaryProps): JSX.Element {
  const call = activity.calls[0]
  const message = activity.messages[0]
  const counts = `${activity.calls.length} call${activity.calls.length === 1 ? '' : 's'} · ${
    activity.messages.length
  } message${activity.messages.length === 1 ? '' : 's'}`

  return (
    <details className="group border-border/70 rounded-lg border" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
        <span className="text-foreground text-sm font-medium">
          Sarvam agent
          <span className="text-muted-foreground font-normal"> · {counts}</span>
        </span>
        <ChevronDown
          className="text-muted-foreground size-4 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-border/70 flex flex-col gap-5 border-t px-4 py-4">
        <section className="flex flex-col gap-2">
          <h4 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
            {activity.calls.length > 1 ? 'Latest call' : 'Call'}
          </h4>
          {errors.calls ? (
            <p role="alert" className="text-danger text-sm">
              {errors.calls}
            </p>
          ) : call ? (
            <CallFacts call={call} />
          ) : (
            <p className="text-muted-foreground text-sm">The agent has not called this customer.</p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
            WhatsApp
          </h4>
          {errors.messages ? (
            <p role="alert" className="text-danger text-sm">
              {errors.messages}
            </p>
          ) : message ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={message.status === 'failed' ? 'danger' : 'neutral'}>
                {message.status === 'sent'
                  ? 'Accepted by WhatsApp'
                  : message.status === 'failed'
                    ? 'Not sent'
                    : 'Unfinished'}
              </Badge>
              <span className="text-muted-foreground">
                {when(message.sent_at || message.created_at)}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No win-back message was sent.</p>
          )}
        </section>
      </div>
    </details>
  )
}
