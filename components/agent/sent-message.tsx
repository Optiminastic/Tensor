'use client'

import { ExternalLink } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import type { MessageLog, MessageTemplate } from '@/lib/validators/message-logs'

export function when(raw: string): string {
  if (!raw) return '—'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * One win-back message, in the words the customer received.
 *
 * THE BUBBLE IS THE POINT. The row above says a message went out; the question
 * somebody actually arrives with is what it said - before replying to a
 * customer, before honouring a discount they are quoting, before believing a
 * complaint. Answering it used to mean opening WhatsApp Manager for the copy,
 * the log for the values and Shopify for the code, then assembling the message
 * by hand.
 *
 * Laid out as the customer saw it, button included, rather than as a table of
 * fields. A message rendered as label-and-value pairs reads as data about a
 * message; the thing being checked here is how it came across.
 */
interface SentMessageProps {
  message: MessageLog
  /** The approved copy, for a row whose own words were not recorded. */
  template: MessageTemplate | null
}

export function SentMessage({ message, template }: SentMessageProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      {message.body ? (
        <div className="flex flex-col gap-2">
          {/* Said above the bubble, not below it. A reader who takes in the
              message first and the caveat second has already formed a view
              of what the customer was told. */}
          {message.reconstructed ? (
            <p className="text-muted-foreground text-sm text-pretty">
              Rebuilt from Shopify — the values are this checkout&apos;s own, in today&apos;s
              approved wording.{' '}
              <span className="text-foreground font-medium">Not a recording of what was sent.</span>
            </p>
          ) : null}

          <div className="flex justify-end">
            <div className="bg-surface-muted max-w-[90%] rounded-xl rounded-br-sm px-3.5 py-2.5">
              {/* whitespace-pre-line, because the approved copy carries its own
                  line breaks and collapsing them turns a laid-out message into
                  one long paragraph nobody would recognise. */}
              <p className="text-foreground text-sm whitespace-pre-line">
                <Spelled body={message.body} />
              </p>

              {/* The button is drawn as a button. Meta keeps URL buttons out of
                the body text, so a bubble showing only the body would describe
                a message referring to a link that is not in it. */}
              {message.link ? (
                <a
                  href={message.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border-border/70 text-link mt-2.5 flex items-center justify-center gap-1.5 border-t pt-2 text-sm font-medium hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Complete checkout
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : template && message.status === 'sent' ? (
        <TemplateFallback template={template} customerName={message.customer_name} />
      ) : (
        <p className="text-muted-foreground text-sm">
          {message.status === 'sent'
            ? 'This message was sent before Tensor began recording the words, and the approved template could not be read, so there is no copy of it here.'
            : 'Nothing was sent, so there is no message to show.'}
        </p>
      )}

      {/* The link again, in full and selectable. The bubble's button is for
          checking that it works; this is for reading where it goes - which
          discount code, and whose basket. */}
      {message.link ? (
        <Field label="Recovery link">
          <span className="text-muted-foreground font-mono text-xs break-all">{message.link}</span>
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sent">{when(message.sent_at)}</Field>
        <Field label="Status">
          <Badge tone={message.status === 'failed' ? 'danger' : 'neutral'}>
            {message.status === 'sent'
              ? 'Accepted by WhatsApp'
              : message.status === 'failed'
                ? 'Not sent'
                : 'Unfinished'}
          </Badge>
        </Field>
        <Field label="Tries">{message.attempts || '—'}</Field>
        <Field label="Message id">
          <span className="text-muted-foreground font-mono text-xs break-all">
            {message.message_id || '—'}
          </span>
        </Field>
      </div>

      {message.detail && message.detail !== 'accepted' ? (
        <Field label="What the sender said">{message.detail}</Field>
      ) : null}

      {/* Said on every row, not only the failures. "Sent" here is Meta's
          acceptance and nothing more, and the one place somebody will look
          when a customer swears they never got it is this panel. */}
      {message.status === 'sent' ? (
        <p className="text-subtle-foreground text-xs">
          Accepted is not delivered. Meta takes a message without promising a phone showed it, and
          India caps marketing messages per recipient — an accepted one can still be dropped. There
          is no delivered state here until the delivery webhook exists.
        </p>
      ) : null}
    </div>
  )
}

interface FieldProps {
  label: string
  children: ReactNode
}

function Field({ label, children }: FieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-sm">{children}</span>
    </div>
  )
}

/** What each unrecorded placeholder stood for, in the template's own order. */
const PLACEHOLDERS: Record<string, string> = {
  '{{1}}': 'customer name',
  '{{2}}': 'their cart items',
  '{{3}}': 'item count',
  '{{4}}': 'cart total',
  '{{5}}': 'discount code',
}

interface TemplateFallbackProps {
  template: MessageTemplate
  customerName: string
}

/**
 * The approved template, for a message sent before Tensor kept its words.
 *
 * THE CUSTOMER'S NAME IS FILLED IN AND NOTHING ELSE IS. It is the one value
 * on the row, so it is certain; the basket, the total and the code were never
 * recorded and are not recoverable - Shopify's abandoned list has moved on
 * and the code was minted per customer. Substituting a plausible value for
 * any of them would turn a template into a forged message, and this panel is
 * read by somebody deciding whether to honour a discount.
 *
 * So the unknown parts stay visibly unknown, as named gaps rather than as
 * guesses, and the heading says this is the template rather than the message.
 */
function TemplateFallback({ template, customerName }: TemplateFallbackProps): JSX.Element {
  const filled = template.body.replaceAll('{{1}}', customerName || 'there')

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm text-pretty">
        Sent before Tensor began recording the words. This is the template it was sent from,{' '}
        <span className="text-foreground font-medium">not a copy of the message</span> — the basket
        and the code it carried were not kept.
      </p>

      <div className="flex justify-end">
        <div className="bg-surface-muted/60 border-border/70 max-w-[90%] rounded-xl rounded-br-sm border border-dashed px-3.5 py-2.5">
          <p className="text-foreground text-sm whitespace-pre-line">
            <Spelled body={filled} />
          </p>
          <span className="border-border/70 text-subtle-foreground mt-2.5 flex items-center justify-center gap-1.5 border-t pt-2 text-sm font-medium">
            <ExternalLink className="size-3.5" aria-hidden />
            Complete checkout
          </span>
        </div>
      </div>

      <p className="text-subtle-foreground text-xs">
        {template.name} · {template.language} · {template.status.toLowerCase()}
      </p>
    </div>
  )
}

interface SpelledProps {
  body: string
}

/**
 * The message text, with any placeholder that could not be filled drawn as a
 * named gap.
 *
 * A recorded body never contains one - it was rendered against real values at
 * send time. A rebuilt one can: Shopify still has the basket but the discount
 * code was minted per customer and never written down, so a customer whose
 * code collided has no recoverable code. Leaving {{5}} as literal text would
 * read as something the customer actually received; filling it with a
 * plausible code would be worse, because somebody reads this panel before
 * honouring one.
 */
function Spelled({ body }: SpelledProps): JSX.Element {
  const parts = body.split(/(\{\{[1-9]\}\})/g)
  return (
    <>
      {parts.map((part, index) =>
        PLACEHOLDERS[part] ? (
          <span
            key={index}
            className="text-subtle-foreground bg-surface-muted rounded px-1 py-0.5 text-xs"
          >
            {PLACEHOLDERS[part]}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}
