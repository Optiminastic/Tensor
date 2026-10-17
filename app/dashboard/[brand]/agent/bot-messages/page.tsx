import type { Metadata } from 'next'
import type { JSX } from 'react'

import { BotMessageEditor } from '@/components/agent/bot-message-editor'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { BotContent } from '@/lib/validators/whatsapp-bot-content'
import { BotContentServiceError, getBotContent } from '@/services/whatsapp-bot-content.service'

export const metadata: Metadata = { title: 'Bot Messages' }

export const dynamic = 'force-dynamic'

interface BotMessagesPageProps {
  params: Promise<{ brand: string }>
}

/**
 * What the WhatsApp bot says, editable without a deploy.
 *
 * The approved WhatsApp templates are deliberately NOT here: their wording
 * lives at Meta, may be edited once a day and needs re-approval, so a text box
 * in Tensor that rewrote them would be lying.
 */
export default async function BotMessagesPage({
  params,
}: BotMessagesPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('whatsapp:read', `/dashboard/${brand}`)
  const canEdit = can(await currentAuthz(), 'whatsapp:reply')

  let content: BotContent | null = null
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      content = await getBotContent(token, brand)
    } catch (err) {
      error = err instanceof BotContentServiceError ? err.message : 'Could not load the wording.'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProductionPageHeader
        title="Bot Messages"
        description="What the WhatsApp bot says when a customer writes in. Changes apply to the next message — no deploy needed."
      />
      {error || !content ? (
        <p className="text-danger text-sm" role="alert">
          {error ?? 'Could not load the wording.'}
        </p>
      ) : (
        <BotMessageEditor brand={brand} initial={content} canEdit={canEdit} />
      )}
    </div>
  )
}
