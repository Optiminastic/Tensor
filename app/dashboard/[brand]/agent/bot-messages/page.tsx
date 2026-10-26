import type { Metadata } from 'next'
import type { JSX } from 'react'

import { BotFlowEditor } from '@/components/agent/bot-flow-editor'
import { BotNoticeEditor } from '@/components/agent/bot-notice-editor'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { BotTree } from '@/lib/validators/whatsapp-bot-content'
import type { BotNotice } from '@/lib/validators/whatsapp-bot-messages'
import { BotContentServiceError, getBotContent } from '@/services/whatsapp-bot-content.service'
import { BotMessagesServiceError, listBotNotices } from '@/services/whatsapp-bot-messages.service'

export const metadata: Metadata = { title: 'Bot Messages' }

export const dynamic = 'force-dynamic'

interface BotMessagesPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The WhatsApp bot, as the conversation a customer actually has.
 *
 * Not a list of strings: a message, the options under it, and what each one
 * does - including opening another message, which is what makes it a tree.
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

  let content: BotTree | null = null
  let notices: BotNotice[] | null = null
  let error: string | null = null
  let noticeError: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      content = await getBotContent(token, brand)
    } catch (err) {
      error = err instanceof BotContentServiceError ? err.message : 'Could not load the wording.'
    }
    // FETCHED SEPARATELY AND FAILING SEPARATELY. The menu and the one-off
    // messages are two independent things to edit, and one being unreachable
    // is no reason to hide the other.
    try {
      notices = await listBotNotices(token, brand)
    } catch (err) {
      noticeError =
        err instanceof BotMessagesServiceError ? err.message : 'Could not load these messages.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <ProductionPageHeader
        eyebrow="Agent"
        title="Bot Messages"
        description="What the WhatsApp bot says, and what happens when a customer taps each option. Changes apply to the next message — no deploy needed."
      />
      {error || !content ? (
        <p className="text-danger text-sm" role="alert">
          {error ?? 'Could not load the wording.'}
        </p>
      ) : (
        <BotFlowEditor brand={brand} initial={content} canEdit={canEdit} />
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Everything else the bot says</h2>
          <p className="text-muted-foreground text-sm text-pretty">
            The messages that are not part of the menu: the damage form, the ₹100 reverse-pickup
            ask, &ldquo;your pickup is booked&rdquo;. Each one saves on its own and applies to the
            next message the bot sends.
          </p>
        </div>
        {noticeError || !notices ? (
          <p className="text-danger text-sm" role="alert">
            {noticeError ?? 'Could not load these messages.'}
          </p>
        ) : (
          <BotNoticeEditor brand={brand} initial={notices} canEdit={canEdit} />
        )}
      </section>
    </main>
  )
}
