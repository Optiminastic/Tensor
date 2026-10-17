import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type BotContent,
  BotContentSchema,
  type BotContentRow,
} from '@/lib/validators/whatsapp-bot-content'

const log = createLogger('WhatsAppBotContentService')

const TIMEOUT_MS = 8_000

export class BotContentServiceError extends Error {}

function contentPath(brand: string): string {
  return `/brands/${encodeURIComponent(brand)}/whatsapp/bot-content`
}

async function call(
  token: string,
  brand: string,
  init: { method?: string; body?: unknown } = {},
): Promise<BotContent> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${contentPath(brand)}`, {
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
    throw new BotContentServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ status: response.status }, 'Tensor-Core rejected a bot-content request')
    // The backend's own sentence names the row and the limit it broke, which
    // is the only useful thing to show somebody mid-edit.
    throw new BotContentServiceError(detail ?? `Request failed (${response.status})`)
  }
  return BotContentSchema.parse(await response.json())
}

/** What the bot currently says, stored rows and code defaults together. */
export async function getBotContent(token: string, brand: string): Promise<BotContent> {
  return call(token, brand)
}

/** Replaces the whole set, and answers with what the bot will say from now on. */
export async function saveBotContent(
  token: string,
  brand: string,
  rows: { menu: BotContentRow[]; faq: BotContentRow[] },
): Promise<BotContent> {
  return call(token, brand, { method: 'PUT', body: rows })
}
