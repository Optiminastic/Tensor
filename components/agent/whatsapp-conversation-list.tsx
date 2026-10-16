'use client'

import type { JSX } from 'react'

import { WhatsAppModeBadge } from '@/components/agent/whatsapp-mode-badge'
import { displayNumber, messageTime } from '@/components/agent/whatsapp-time'
import { cn } from '@/lib/utils'
import type { WhatsAppConversation } from '@/lib/validators/whatsapp-inbox'

interface WhatsAppConversationListProps {
  conversations: WhatsAppConversation[]
  selected: string | null
  onSelect: (waId: string) => void
}

/** The brand's chats, most recent first. */
export function WhatsAppConversationList({
  conversations,
  selected,
  onSelect,
}: WhatsAppConversationListProps): JSX.Element {
  if (conversations.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-sm text-pretty">
        No WhatsApp conversations yet. They appear here as soon as a customer messages the shop.
      </p>
    )
  }
  return (
    <ul className="divide-border flex flex-col divide-y" aria-label="Conversations">
      {conversations.map(c => (
        <li key={c.wa_id}>
          <button
            type="button"
            onClick={() => onSelect(c.wa_id)}
            aria-current={selected === c.wa_id ? 'true' : undefined}
            className={cn(
              'hover:bg-surface-muted flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
              selected === c.wa_id && 'bg-surface-muted',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {c.profile_name || displayNumber(c.wa_id)}
              </span>
              <span className="text-subtle-foreground shrink-0 font-mono text-xs tabular-nums">
                {messageTime(c.last_message_at)}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground truncate text-sm">
                {c.last_message_preview}
              </span>
              <WhatsAppModeBadge mode={c.mode} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
