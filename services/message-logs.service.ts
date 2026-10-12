import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type MessageLog,
  MessageLogsResponseSchema,
  type MessageTemplate,
  MessageTemplateSchema,
} from '@/lib/validators/message-logs'

const log = createLogger('MessageLogsService')

/**
 * Short, unlike the call log's twenty seconds.
 *
 * This reads one table in Tensor's own database. The call log pages Sarvam's
 * analytics API over a month of calls; there is no upstream here at all,
 * because without a delivery webhook Meta has nothing to add to what was
 * recorded at send time.
 */
const TIMEOUT_MS = 8_000

export class MessageLogsServiceError extends Error {}

/** Every win-back message for this brand, newest first. */
export async function listMessageLogs(token: string, brand: string): Promise<MessageLog[]> {
  const path = `/brands/${encodeURIComponent(brand)}/message-logs`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new MessageLogsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status }, 'Tensor-Core rejected the message-logs request')
    throw new MessageLogsServiceError(detail ?? `Request failed (${response.status})`)
  }

  return MessageLogsResponseSchema.parse(await response.json()).items
}

/**
 * The approved template this brand sends, or null.
 *
 * NULL RATHER THAN THROWING on every failure. This is shown beside rows that
 * already loaded, to explain what they said; a brand with no WhatsApp
 * connected, or a Meta hiccup, must not take the whole Logs page down over a
 * footnote.
 */
export async function getMessageTemplate(
  token: string,
  brand: string,
): Promise<MessageTemplate | null> {
  const path = `/brands/${encodeURIComponent(brand)}/message-logs/template`
  try {
    const response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) {
      log.warn({ path, status: response.status }, 'Could not read the approved template')
      return null
    }
    return MessageTemplateSchema.parse(await response.json())
  } catch (error) {
    log.warn({ path, err: error }, 'Could not read the approved template')
    return null
  }
}
