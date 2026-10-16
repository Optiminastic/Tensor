'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, type JSX } from 'react'

import { listConversationsAction } from '@/app/dashboard/[brand]/agent/inbox/actions'
import { WhatsAppConversationList } from '@/components/agent/whatsapp-conversation-list'
import { INBOX_POLL_MS, WhatsAppThread } from '@/components/agent/whatsapp-thread'
import type { WhatsAppConversation } from '@/lib/validators/whatsapp-inbox'

interface WhatsAppInboxProps {
  brand: string
  initialConversations: WhatsAppConversation[]
  canReply: boolean
}

/** The chat list beside the open conversation. */
export function WhatsAppInbox({
  brand,
  initialConversations,
  canReply,
}: WhatsAppInboxProps): JSX.Element {
  const [selected, setSelected] = useState<string | null>(initialConversations[0]?.wa_id ?? null)
  const { data: conversations = initialConversations, refetch } = useQuery({
    queryKey: ['whatsapp-conversations', brand],
    queryFn: async (): Promise<WhatsAppConversation[]> => {
      const result = await listConversationsAction(brand)
      if (!result.ok || !result.data)
        throw new Error(result.error ?? 'Could not load conversations.')
      return result.data
    },
    initialData: initialConversations,
    refetchInterval: INBOX_POLL_MS,
  })

  return (
    <div className="border-border bg-surface grid h-[calc(100dvh-14rem)] min-h-[28rem] overflow-hidden rounded-lg border md:grid-cols-[20rem_1fr]">
      <div className="border-border min-h-0 overflow-y-auto border-b md:border-r md:border-b-0">
        <WhatsAppConversationList
          conversations={conversations}
          selected={selected}
          onSelect={setSelected}
        />
      </div>
      <div className="min-h-0">
        {selected ? (
          <WhatsAppThread
            key={selected}
            brand={brand}
            waId={selected}
            canReply={canReply}
            onChanged={() => void refetch()}
          />
        ) : (
          <p className="text-muted-foreground p-6 text-sm">Pick a conversation to read it.</p>
        )}
      </div>
    </div>
  )
}
