import type { JSX } from 'react'

import { messageTime } from '@/components/agent/whatsapp-time'
import { cn } from '@/lib/utils'
import type { WhatsAppMessage } from '@/lib/validators/whatsapp-inbox'

interface WhatsAppMessageBubbleProps {
  message: WhatsAppMessage
  /** The brand whose conversation this is - the media route is scoped by it. */
  brand: string
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
export function WhatsAppMessageBubble({ message, brand }: WhatsAppMessageBubbleProps): JSX.Element {
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

        <Attachment message={message} brand={brand} />

        {/* whitespace-pre-line keeps the line breaks the bot's menus and
            order updates are written with. A caption is stored as the body,
            so it lands here under its own photograph. */}
        {message.body || message.media_status === '' ? (
          <p className="text-sm break-words whitespace-pre-line">
            {message.body || `[${message.kind}]`}
          </p>
        ) : null}

        <span className="text-subtle-foreground flex items-center justify-end gap-2 text-xs">
          {failed ? <span className="text-danger font-medium">Not delivered</span> : null}
          <span className="font-mono tabular-nums">{messageTime(message.created_at)}</span>
        </span>
      </div>
    </div>
  )
}

/**
 * The attachment, in whichever of its three states it is in.
 *
 * DOWNLOADING AND UNAVAILABLE ARE DIFFERENT ANSWERS. A customer reporting
 * damage sends photographs; whether those reached Tensor decides whether
 * anyone can act on the report, and a single grey "[image]" for both states
 * answers the question wrongly half the time.
 */
function Attachment({ message, brand }: WhatsAppMessageBubbleProps): JSX.Element | null {
  if (message.media_status === '') return null

  if (message.media_status === 'pending') {
    return (
      <div className="bg-surface-muted text-muted-foreground flex h-32 w-48 animate-pulse items-center justify-center rounded-lg text-xs">
        Downloading…
      </div>
    )
  }
  if (message.media_status === 'failed') {
    return (
      <div className="border-border text-muted-foreground flex h-32 w-48 items-center justify-center rounded-lg border border-dashed text-xs text-pretty">
        Attachment unavailable
      </div>
    )
  }

  const href = `/api/whatsapp/${encodeURIComponent(brand)}/media/${encodeURIComponent(message.id)}`

  // A video is linked rather than embedded: a thread of autoplaying <video>
  // elements is a page nobody can read, and the one that matters is opened
  // deliberately.
  if (!message.mime_type.startsWith('image/')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent text-sm underline-offset-4 hover:underline"
      >
        Open {message.kind}
      </a>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {/* Plain <img>: these are customer uploads of unknown dimensions behind
          an authenticated route, which next/image can neither size ahead of
          time nor fetch through its optimiser. */}
      <img
        src={href}
        alt={message.body || 'Photo from the customer'}
        loading="lazy"
        className="max-h-64 w-auto rounded-lg object-contain"
      />
    </a>
  )
}
