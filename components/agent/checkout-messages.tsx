import type { JSX } from 'react'

import { SentMessage } from '@/components/agent/sent-message'
import type { MessageLog, MessageTemplate } from '@/lib/validators/message-logs'

interface CheckoutMessagesProps {
  /** Newest first. */
  messages: MessageLog[]
  template: MessageTemplate | null
  error: string | null
}

/**
 * Every WhatsApp message the agent sent this customer about this basket, in
 * the words they received - newest first, each one whole.
 */
export function CheckoutMessages({
  messages,
  template,
  error,
}: CheckoutMessagesProps): JSX.Element {
  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
        {error}
      </p>
    )
  }
  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-pretty">
        No win-back message was sent for this checkout. One goes out ten minutes after a checkout is
        abandoned, once WhatsApp is switched on.
      </p>
    )
  }

  return (
    <div className="divide-border/70 flex flex-col divide-y">
      {messages.map((message, index) => (
        <div key={`${message.message_id}-${index}`} className="py-5 first:pt-0 last:pb-0">
          <SentMessage message={message} template={template} />
        </div>
      ))}
    </div>
  )
}
