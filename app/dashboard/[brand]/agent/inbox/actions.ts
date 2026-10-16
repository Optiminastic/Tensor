'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import {
  type WhatsAppConversation,
  type WhatsAppMessage,
  type WhatsAppThread,
  WhatsAppReplySchema,
  WhatsAppThreadRequestSchema,
} from '@/lib/validators/whatsapp-inbox'
import {
  WhatsAppInboxServiceError,
  getWhatsAppThread,
  handBackWhatsAppConversation,
  listWhatsAppConversations,
  sendWhatsAppReply,
} from '@/services/whatsapp-inbox.service'

const log = createLogger('WhatsAppInboxActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function failure<T>(error: unknown): ActionResult<T> {
  if (error instanceof WhatsAppInboxServiceError) return { ok: false, error: error.message }
  log.error({ err: error }, 'Unexpected WhatsApp inbox error')
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

/*
 * Every action re-resolves the token from the session. The brand and number
 * arguments are client-controlled; Tensor-Core checks whatsapp:read and
 * whatsapp:reply against the token, which is the only check that counts.
 */

export async function listConversationsAction(
  brand: string,
): Promise<ActionResult<WhatsAppConversation[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await listWhatsAppConversations(token, brand) }
  } catch (err) {
    return failure(err)
  }
}

export async function loadThreadAction(input: unknown): Promise<ActionResult<WhatsAppThread>> {
  const parsed = WhatsAppThreadRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Pick a conversation.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await getWhatsAppThread(token, parsed.data.brand, parsed.data.waId) }
  } catch (err) {
    return failure(err)
  }
}

export async function sendReplyAction(input: unknown): Promise<ActionResult<WhatsAppMessage>> {
  const parsed = WhatsAppReplySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the reply and retry.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const message = await sendWhatsAppReply(token, parsed.data)
    log.info({ messageId: message.id }, 'Sent a WhatsApp reply from the inbox')
    return { ok: true, data: message }
  } catch (err) {
    return failure(err)
  }
}

export async function handBackAction(input: unknown): Promise<ActionResult> {
  const parsed = WhatsAppThreadRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Pick a conversation.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await handBackWhatsAppConversation(token, parsed.data.brand, parsed.data.waId)
    return { ok: true }
  } catch (err) {
    return failure(err)
  }
}
