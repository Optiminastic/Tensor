'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type { BotNode, BotTree } from '@/lib/validators/whatsapp-bot-content'
import type { BotNotice } from '@/lib/validators/whatsapp-bot-messages'
import {
  BotContentServiceError,
  getBotContent,
  saveBotContent,
} from '@/services/whatsapp-bot-content.service'
import {
  BotMessagesServiceError,
  resetBotNotice,
  saveBotNotice,
} from '@/services/whatsapp-bot-messages.service'

const log = createLogger('BotContentActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function failure<T>(error: unknown): ActionResult<T> {
  if (error instanceof BotContentServiceError) return { ok: false, error: error.message }
  log.error({ err: error }, 'Unexpected bot-content error')
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

/*
 * Both actions re-resolve the token from the session. The brand argument is
 * client-controlled; Tensor-Core checks whatsapp:read and whatsapp:reply
 * against the token, and that is the only check that counts.
 */

export async function loadBotContentAction(brand: string): Promise<ActionResult<BotTree>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await getBotContent(token, brand) }
  } catch (err) {
    return failure(err)
  }
}

export async function saveBotContentAction(input: {
  brand: string
  nodes: BotNode[]
}): Promise<ActionResult<BotTree>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const data = await saveBotContent(token, input.brand, input.nodes)
    return { ok: true, data }
  } catch (err) {
    return failure(err)
  }
}

/*
 * The one-off messages, saved one at a time.
 *
 * Each returns the WHOLE set, so the page shows what is actually stored rather
 * than what it hoped it stored - and a save refused for one message cannot
 * leave the others looking changed.
 */

export async function saveBotNoticeAction(input: {
  brand: string
  key: string
  body: string
}): Promise<ActionResult<BotNotice[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await saveBotNotice({ token, ...input }) }
  } catch (err) {
    return noticeFailure(err)
  }
}

export async function resetBotNoticeAction(input: {
  brand: string
  key: string
}): Promise<ActionResult<BotNotice[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await resetBotNotice({ token, ...input }) }
  } catch (err) {
    return noticeFailure(err)
  }
}

function noticeFailure<T>(error: unknown): ActionResult<T> {
  if (error instanceof BotMessagesServiceError) return { ok: false, error: error.message }
  log.error({ err: error }, 'Unexpected bot-message error')
  return { ok: false, error: 'Something went wrong. Please try again.' }
}
