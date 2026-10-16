import type { Metadata } from 'next'
import type { JSX } from 'react'

import { WhatsAppInbox } from '@/components/agent/whatsapp-inbox'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { WhatsAppConversation } from '@/lib/validators/whatsapp-inbox'
import {
  WhatsAppInboxServiceError,
  listWhatsAppConversations,
} from '@/services/whatsapp-inbox.service'

export const metadata: Metadata = { title: 'WhatsApp Inbox' }

export const dynamic = 'force-dynamic'

interface WhatsAppInboxPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Every WhatsApp conversation the brand's number has had - customers, the menu
 * bot's answers, and staff replies from here or from the WhatsApp Business app -
 * with a reply box for the ones a person should answer.
 */
export default async function WhatsAppInboxPage({
  params,
}: WhatsAppInboxPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('whatsapp:read', `/dashboard/${brand}`)
  const canReply = can(await currentAuthz(), 'whatsapp:reply')

  let conversations: WhatsAppConversation[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      conversations = await listWhatsAppConversations(token, brand)
    } catch (err) {
      error =
        err instanceof WhatsAppInboxServiceError ? err.message : 'Could not load conversations.'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProductionPageHeader
        title="WhatsApp Inbox"
        description="Customer chats on the shop's WhatsApp number. Replying takes a chat over from the bot; hand it back when you are done."
      />
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : (
        <WhatsAppInbox brand={brand} initialConversations={conversations} canReply={canReply} />
      )}
    </div>
  )
}
