import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type WhatsAppConversation,
  WhatsAppConversationsResponseSchema,
  type WhatsAppMessage,
  WhatsAppMessageSchema,
  type WhatsAppThread,
  WhatsAppThreadResponseSchema,
} from '@/lib/validators/whatsapp-inbox'

const log = createLogger('WhatsAppInboxService')

/**
 * Reads are Tensor's own tables. A reply waits on Meta's API as well, which is
 * why it gets longer.
 */
const READ_TIMEOUT_MS = 8_000
const SEND_TIMEOUT_MS = 35_000

export class WhatsAppInboxServiceError extends Error {}

function conversationsPath(brand: string): string {
  return `/brands/${encodeURIComponent(brand)}/whatsapp/conversations`
}

function threadPath(brand: string, waId: string): string {
  return `${conversationsPath(brand)}/${encodeURIComponent(waId)}`
}

async function call(
  token: string,
  path: string,
  init: { method?: string; body?: unknown; timeoutMs: number },
): Promise<Response> {
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
      signal: AbortSignal.timeout(init.timeoutMs),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new WhatsAppInboxServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    // The customer's number stays out of the log: the path carries it, and a
    // status code is all a log reader needs.
    log.warn({ status: response.status }, 'Tensor-Core rejected a WhatsApp inbox request')
    throw new WhatsAppInboxServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}

/** The brand's conversations, most recent first. */
export async function listWhatsAppConversations(
  token: string,
  brand: string,
): Promise<WhatsAppConversation[]> {
  const response = await call(token, conversationsPath(brand), { timeoutMs: READ_TIMEOUT_MS })
  return WhatsAppConversationsResponseSchema.parse(await response.json()).items
}

/** One conversation and its messages, oldest first. */
export async function getWhatsAppThread(
  token: string,
  brand: string,
  waId: string,
): Promise<WhatsAppThread> {
  const response = await call(token, `${threadPath(brand, waId)}/messages`, {
    timeoutMs: READ_TIMEOUT_MS,
  })
  return WhatsAppThreadResponseSchema.parse(await response.json())
}

export interface WhatsAppReply {
  brand: string
  waId: string
  text: string
}

/** Sends a reply as the shop. Takes the conversation over from the bot. */
export async function sendWhatsAppReply(
  token: string,
  { brand, waId, text }: WhatsAppReply,
): Promise<WhatsAppMessage> {
  const response = await call(token, `${threadPath(brand, waId)}/messages`, {
    method: 'POST',
    body: { text },
    timeoutMs: SEND_TIMEOUT_MS,
  })
  return WhatsAppMessageSchema.parse(await response.json())
}

/** Returns the conversation to the menu bot. */
export async function handBackWhatsAppConversation(
  token: string,
  brand: string,
  waId: string,
): Promise<void> {
  await call(token, `${threadPath(brand, waId)}/handback`, {
    method: 'POST',
    timeoutMs: READ_TIMEOUT_MS,
  })
}

/**
 * One attachment's raw bytes, as a Response the route handler streams on.
 *
 * Deliberately not routed through `call`: that helper asks for JSON and reads
 * the body to find a `detail`, and this is a photograph. The status is passed
 * back untouched because the backend distinguishes an attachment still
 * downloading from one that failed, and the bubble draws those differently.
 */
export async function fetchWhatsAppMedia(
  token: string,
  brand: string,
  messageId: string,
): Promise<Response> {
  const path =
    `/brands/${encodeURIComponent(brand)}` +
    `/whatsapp/messages/${encodeURIComponent(messageId)}/media`
  try {
    return await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ err: error }, 'Tensor-Core is unreachable')
    throw new WhatsAppInboxServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
}
