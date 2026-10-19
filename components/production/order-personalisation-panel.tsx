'use client'

import { type JSX } from 'react'

import { Tag } from '@/components/ui/tag'
import { dateTime } from '@/lib/format'
import type { OrderPersonalisation } from '@/lib/validators/order-personalisation'

interface OrderPersonalisationPanelProps {
  data: OrderPersonalisation
}

/**
 * What this customer was asked, and what they changed.
 *
 * The message first and in full, because the question somebody opens this tab
 * with is "what did we actually say to them" - a summary of a message is not
 * an answer to that. The changes follow, since they only make sense once you
 * know what was asked.
 */
export function OrderPersonalisationPanel({ data }: OrderPersonalisationPanelProps): JSX.Element {
  const changed = data.items.filter(item => item.changes.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
          The message we sent
        </h3>
        {data.message ? (
          <SentMessage message={data.message} />
        ) : (
          <NeverAsked reason={data.skip_reason ?? null} />
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
          What the customer changed
        </h3>
        {changed.length === 0 ? (
          <p className="text-muted-foreground text-sm text-pretty">
            {data.items.length === 0
              ? 'This order made nothing a customer could change.'
              : 'Nothing was changed — the order is being made with the details given at checkout.'}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {changed.map(item => (
              <div key={item.job_id} className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  {item.product_name || 'Item'}{' '}
                  <span className="text-subtle-foreground font-mono text-[11px]">
                    {item.job_number}
                  </span>
                </p>
                <dl className="flex flex-col gap-1.5">
                  {item.changes.map(change => (
                    <div key={change.label} className="flex flex-col gap-0.5">
                      <dt className="text-subtle-foreground text-[11px] tracking-wide uppercase">
                        {change.label}
                      </dt>
                      {/* Both values on one line: the new one is what gets
                          made, and the old one only exists to show what
                          moved. */}
                      <dd className="flex flex-wrap items-center gap-1.5 text-sm break-words">
                        <span className="text-muted-foreground line-through">{change.from}</span>
                        <span className="text-subtle-foreground">→</span>
                        <span className="text-foreground font-medium">{change.to}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * Nobody was messaged - and, where Tensor knows it, the rule that decided so.
 *
 * The list of maybes below is the fallback for an order whose verdict
 * predates Tensor recording one. When there IS a reason it goes first and in
 * the sender's own words, because "which of those six was it" is the entire
 * question somebody opens this tab with.
 */
function NeverAsked({ reason }: { reason: string | null }): JSX.Element {
  if (reason) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm text-pretty">
          No personalisation link was sent for this order.
        </p>
        <p className="bg-surface-muted text-foreground rounded-xl px-3 py-2 text-sm text-pretty">
          {reason}
        </p>
      </div>
    )
  }
  return (
    <p className="text-muted-foreground text-sm text-pretty">
      No personalisation link was sent for this order. That happens when the check was switched off,
      the order carried no phone number, or it was placed before the shop began asking.
    </p>
  )
}

function SentMessage({
  message,
}: {
  message: NonNullable<OrderPersonalisation['message']>
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Tag tone={toneFor(message.status)}>{message.status}</Tag>
        <span className="text-muted-foreground font-mono">{message.to}</span>
        {message.sent_at ? (
          <span className="text-subtle-foreground">{dateTime(message.sent_at)}</span>
        ) : null}
      </div>

      {message.detail ? (
        // The sender's own note - "sent to the test recipient, not the
        // customer" for a redirected send, or Meta's refusal. It is the
        // difference between a message a customer read and one they did not.
        <p className="bg-warning-subtle text-warning rounded-xl px-3 py-2 text-xs text-pretty">
          {message.detail}
        </p>
      ) : null}

      {message.body ? (
        <>
          {/* As WhatsApp showed it: the asterisks are WhatsApp's own bold and
              are left in rather than rendered, because this panel quotes a
              message rather than imitating it. */}
          <pre className="bg-surface-muted text-foreground overflow-x-auto rounded-2xl px-4 py-3 font-sans text-sm whitespace-pre-wrap">
            {message.body}
          </pre>
          <p className="text-subtle-foreground text-[11px]">
            {message.template}
            {message.language ? ` · ${message.language}` : ''}
            {message.buttons > 0 ? ` · ${message.buttons} buttons` : ''}
            {/* Said out loud, because they are different claims: a frozen
                body is the words that left, and a rebuilt one is today's
                template filled with this order's values. */}
            {message.reconstructed ? ' · rebuilt from the approved template' : ' · as sent'}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-sm text-pretty">
          The message was sent, but its wording could not be read back from WhatsApp just now.
        </p>
      )}
    </div>
  )
}

function toneFor(status: string): 'success' | 'warning' | 'danger' | 'muted' {
  switch (status) {
    case 'sent':
    case 'opened':
    case 'confirmed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'expired':
      return 'muted'
    default:
      return 'warning'
  }
}
