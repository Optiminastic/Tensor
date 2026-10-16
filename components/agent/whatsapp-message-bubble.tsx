import type { JSX } from 'react'

import { messageTime } from '@/components/agent/whatsapp-time'
import { cn } from '@/lib/utils'
import type { WhatsAppMessage } from '@/lib/validators/whatsapp-inbox'

interface WhatsAppMessageBubbleProps {
  message: WhatsAppMessage
}

const AUTHOR_LABEL: Record<WhatsAppMessage['author'], string> = {
  customer: 'Customer',
  bot: 'Bot',
  staff: 'Staff',
}

/**
 * One message, laid out as WhatsApp lays it out: the customer on the left, the
 * shop (bot or staff) on the right.
 */
export function WhatsAppMessageBubble({ message }: WhatsAppMessageBubbleProps): JSX.Element {
  const fromShop = message.author !== 'customer'
  const failed = message.status === 'failed'
  return (
    <div className={cn('flex', fromShop ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1 rounded-xl px-3.5 py-2.5',
          fromShop ? 'bg-accent-subtle rounded-br-sm' : 'bg-surface-muted rounded-bl-sm',
        )}
      >
        <span className="text-muted-foreground text-xs font-medium">
          {AUTHOR_LABEL[message.author]}
        </span>
        {/* whitespace-pre-line keeps the line breaks the bot's menus and
            order updates are written with. */}
        <p className="text-sm break-words whitespace-pre-line">
          {message.body || `[${message.kind}]`}
        </p>
        <span className="text-subtle-foreground flex items-center justify-end gap-2 text-xs">
          {failed ? <span className="text-danger font-medium">Not delivered</span> : null}
          <span className="font-mono tabular-nums">{messageTime(message.created_at)}</span>
        </span>
      </div>
    </div>
  )
}
