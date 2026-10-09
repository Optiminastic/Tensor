import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type CallLog,
  type Transcript,
  CallLogsResponseSchema,
  TranscriptSchema,
} from '@/lib/validators/call-logs'

const log = createLogger('CallLogsService')

/**
 * Longer than the usual 5s: this is Tensor asking Sarvam's analytics API,
 * which pages over a month of calls. It is a read, so a slow one costs
 * patience rather than correctness.
 */
const TIMEOUT_MS = 20_000

export class CallLogsServiceError extends Error {}

async function call<T>(path: string, token: string, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new CallLogsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status }, 'Tensor-Core rejected the call-logs request')
    // Sarvam's own sentence, passed through: its refusals name the window, the
    // id or the key that was wrong.
    throw new CallLogsServiceError(detail ?? `Request failed (${response.status})`)
  }
  return parse(await response.json())
}

/** Every call the agent has made for this brand, newest first. */
export async function listCallLogs(token: string, brand: string): Promise<CallLog[]> {
  return call(
    `/brands/${encodeURIComponent(brand)}/call-logs`,
    token,
    data => CallLogsResponseSchema.parse(data).items,
  )
}

/**
 * One call, turn by turn.
 *
 * The interaction id goes in the QUERY STRING, not the path. It looks like
 * "20261007/8dfc36f1-13:19:48-ea3d34fe", and encoding that slash into a path
 * segment does not help: the router decodes it straight back into a separator,
 * the route stops matching, and every transcript answers 404.
 */
export async function getTranscript(
  token: string,
  brand: string,
  interactionId: string,
): Promise<Transcript> {
  return call(
    `/brands/${encodeURIComponent(brand)}/call-logs/transcript?interaction=${encodeURIComponent(interactionId)}`,
    token,
    data => TranscriptSchema.parse(data),
  )
}
