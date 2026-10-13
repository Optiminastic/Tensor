'use client'

import { Bot } from 'lucide-react'
import { useState, type JSX } from 'react'

import { handBackAction } from '@/app/dashboard/[brand]/agent/inbox/actions'
import { WhatsAppModeBadge } from '@/components/agent/whatsapp-mode-badge'
import { displayNumber } from '@/components/agent/whatsapp-time'
import { Button } from '@/components/ui/button'
import type { WhatsAppConversation } from '@/lib/validators/whatsapp-inbox'

interface WhatsAppThreadHeaderProps {
  brand: string
  conversation: WhatsAppConversation
  /** Whether the viewer holds whatsapp:reply. UX only; Tensor-Core enforces it. */
  canReply: boolean
  onChanged: () => void
}

/** Who the customer is, who is answering them, and the way back to the bot. */
export function WhatsAppThreadHeader({
  brand,
  conversation,
  canReply,
  onChanged,
}: WhatsAppThreadHeaderProps): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handBack(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await handBackAction({ brand, waId: conversation.wa_id })
    setBusy(false)
    if (!result.ok) setError(result.error ?? 'Could not hand the chat back.')
    else onChanged()
  }

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {conversation.profile_name || displayNumber(conversation.wa_id)}
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {displayNumber(conversation.wa_id)}
          {conversation.opted_out ? ' · opted out of automated messages' : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {error ? <span className="text-danger text-xs">{error}</span> : null}
        <WhatsAppModeBadge mode={conversation.mode} />
        {canReply && conversation.mode === 'human' ? (
          <Button variant="secondary" size="sm" onClick={handBack} disabled={busy}>
            <Bot className="size-4" aria-hidden />
            Hand back to bot
          </Button>
        ) : null}
      </div>
    </div>
  )
}
