'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type JSX } from 'react'

import { loadThreadAction } from '@/app/dashboard/[brand]/agent/inbox/actions'
import { WhatsAppMessageBubble } from '@/components/agent/whatsapp-message-bubble'
import { WhatsAppReplyBox } from '@/components/agent/whatsapp-reply-box'
import { WhatsAppThreadHeader } from '@/components/agent/whatsapp-thread-header'
import type { WhatsAppThread as Thread } from '@/lib/validators/whatsapp-inbox'

/** New messages arrive by polling; a customer waiting a few seconds is fine. */
export const INBOX_POLL_MS = 10_000

interface WhatsAppThreadProps {
  brand: string
  waId: string
  canReply: boolean
  /** Called after a change the chat list should reflect (a reply, a hand-back). */
  onChanged: () => void
}

/** One conversation: the messages, newest at the bottom, and the reply box. */
export function WhatsAppThread({
  brand,
  waId,
  canReply,
  onChanged,
}: WhatsAppThreadProps): JSX.Element {
  const bottom = useRef<HTMLDivElement>(null)
  const { data, error, refetch } = useQuery({
    queryKey: ['whatsapp-thread', brand, waId],
    queryFn: async (): Promise<Thread> => {
      const result = await loadThreadAction({ brand, waId })
      if (!result.ok || !result.data) throw new Error(result.error ?? 'Could not load the chat.')
      return result.data
    },
    refetchInterval: INBOX_POLL_MS,
  })

  const count = data?.items.length ?? 0
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [count])

  if (error) return <p className="text-danger p-6 text-sm">{error.message}</p>
  if (!data) return <p className="text-muted-foreground p-6 text-sm">Loading the chat…</p>

  async function changed(): Promise<void> {
    await refetch()
    onChanged()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WhatsAppThreadHeader
        brand={brand}
        conversation={data.conversation}
        canReply={canReply}
        onChanged={changed}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {data.items.map(m => (
          <WhatsAppMessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottom} />
      </div>
      {canReply ? (
        <WhatsAppReplyBox
          brand={brand}
          waId={waId}
          windowOpen={data.conversation.can_reply}
          onSent={changed}
        />
      ) : null}
    </div>
  )
}
