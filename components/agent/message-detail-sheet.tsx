'use client'

import { ExternalLink } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { CopyableId } from '@/components/ui/copyable-id'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { MessageLog } from '@/lib/validators/message-logs'

interface MessageDetailSheetProps {
  /** The message to show, or null when the panel is closed. */
  message: MessageLog | null
  onClose: () => void
}

function when(raw: string): string {
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
export function MessageDetailSheet({ message, onClose }: MessageDetailSheetProps): JSX.Element {
  return (
    <Sheet open={message !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="flex max-w-xl flex-col">
        <SheetHeader>
          <SheetTitle>Message details</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2">
              {message?.checkout_name ? (
                <CopyableId value={message.checkout_name} label="checkout" />
              ) : (
                <span className="text-subtle-foreground text-sm">No checkout recorded</span>
              )}
              <span className="text-subtle-foreground text-sm">
                {message?.customer_name || 'Unnamed customer'} · {message?.phone}
              </span>
            </div>
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex-1">
          {message ? <SentMessage message={message} /> : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

interface SentMessageProps {
  message: MessageLog
}

function SentMessage({ message }: SentMessageProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      {message.body ? (
        <div className="flex justify-end">
          <div className="bg-surface-muted max-w-[90%] rounded-xl rounded-br-sm px-3.5 py-2.5">
            {/* whitespace-pre-line, because the approved copy carries its own
                line breaks and collapsing them turns a laid-out message into
                one long paragraph nobody would recognise. */}
            <p className="text-foreground text-sm whitespace-pre-line">{message.body}</p>

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
      ) : (
        <p className="text-muted-foreground text-sm">
          {message.status === 'sent'
            ? 'This message was sent before Tensor began recording the words, so there is no copy of it here.'
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
