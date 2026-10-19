import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type BotNode, type BotTree, BotTreeSchema } from '@/lib/validators/whatsapp-bot-content'

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
): Promise<BotTree> {
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
  return BotTreeSchema.parse(await response.json())
}

/** The bot's tree: the shop's own where it has one, the code's where not. */
export async function getBotContent(token: string, brand: string): Promise<BotTree> {
  return call(token, brand)
}

/**
 * Replaces the WHOLE tree, and answers with what the bot will say from now on.
 *
 * Not a patch: which messages exist, which options are on them and the order
 * of both are one decision, and sending them piecemeal would leave a
 * half-saved menu behind a second call that failed on its own.
 */
export async function saveBotContent(
  token: string,
  brand: string,
  nodes: BotNode[],
): Promise<BotTree> {
  return call(token, brand, { method: 'PUT', body: { nodes } })
}
