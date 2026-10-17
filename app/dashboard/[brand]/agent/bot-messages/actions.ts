'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type { BotContent, BotContentRow } from '@/lib/validators/whatsapp-bot-content'
import {
  BotContentServiceError,
  getBotContent,
  saveBotContent,
} from '@/services/whatsapp-bot-content.service'

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

export async function loadBotContentAction(brand: string): Promise<ActionResult<BotContent>> {
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
  menu: BotContentRow[]
  faq: BotContentRow[]
}): Promise<ActionResult<BotContent>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const data = await saveBotContent(token, input.brand, { menu: input.menu, faq: input.faq })
    return { ok: true, data }
  } catch (err) {
    return failure(err)
  }
}
