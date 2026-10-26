import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type BotNotice, BotNoticesResponseSchema } from '@/lib/validators/whatsapp-bot-messages'

const log = createLogger('WhatsAppBotMessagesService')

const TIMEOUT_MS = 8_000

export class BotMessagesServiceError extends Error {}

function messagesPath(brand: string): string {
  return `/brands/${encodeURIComponent(brand)}/whatsapp/bot-messages`
}

/**
 * ONE MESSAGE PER CALL, not the whole set.
 *
 * The tree is saved wholesale because it is edited as one structure. These are
 * independent lines, and sending them together would let somebody saving a typo
 * fix silently revert a colleague's rewrite of a different message.
 */
async function call(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<BotNotice[]> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ err: error }, 'Tensor-Core is unreachable')
    throw new BotMessagesServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ status: response.status }, 'Tensor-Core rejected a bot-message request')
    // Tensor-Core's refusals name the field and what is wrong with it, and
    // the person typing is who can act on that.
    throw new BotMessagesServiceError(detail ?? `Request failed (${response.status})`)
  }
  return BotNoticesResponseSchema.parse(await response.json()).messages
}

/** Every editable message, with the shop's wording where there is one. */
export async function listBotNotices(token: string, brand: string): Promise<BotNotice[]> {
  return call(token, messagesPath(brand))
}

/** Stores one rewritten message. Takes effect on the next WhatsApp message. */
export async function saveBotNotice(input: {
  token: string
  brand: string
  key: string
  body: string
}): Promise<BotNotice[]> {
  const { token, brand, key, body } = input
  return call(token, `${messagesPath(brand)}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: { body },
  })
}

/** Puts one message back to the wording that ships in the backend. */
export async function resetBotNotice(input: {
  token: string
  brand: string
  key: string
}): Promise<BotNotice[]> {
  const { token, brand, key } = input
  return call(token, `${messagesPath(brand)}/${encodeURIComponent(key)}`, { method: 'DELETE' })
}
