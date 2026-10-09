import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type VoiceCallInput,
  type VoiceCallResult,
  type VoiceStatus,
  VoiceCallResultSchema,
  VoiceStatusSchema,
} from '@/lib/validators/voice-calls'

const log = createLogger('VoiceCallsService')

/**
 * Longer than the usual 5s: this is a round trip through Tensor to Sarvam and
 * on to the telephony provider. It returns once the call is ACCEPTED, not when
 * anybody answers, but it is still three hops rather than one.
 */
const TIMEOUT_MS = 30_000

/**
 * Typed client for Tensor-Core's /voice endpoints.
 *
 * Server-only. Every call carries the user's bearer token; the backend enforces
 * `integration:manage` against it.
 */

export class VoiceCallsServiceError extends Error {}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (data: unknown) => T,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new VoiceCallsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status }, 'Tensor-Core rejected the voice request')
    // Sarvam's own sentence, passed through. Its refusals name the thing to go
    // and fix - a number missing from a connection, a field in the wrong place
    // - and the operator is the person who can act on that.
    throw new VoiceCallsServiceError(detail ?? `Request failed (${response.status})`)
  }

  return parse(await response.json())
}

function bearer(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/** Whether voice calling is configured on this deployment. */
export async function getVoiceStatus(accessToken: string): Promise<VoiceStatus> {
  return request('/voice/status', { method: 'GET', headers: bearer(accessToken) }, data =>
    VoiceStatusSchema.parse(data),
  )
}

/** Places one outbound call and returns Sarvam's attempt id. */
export async function placeVoiceCall(
  accessToken: string,
  input: VoiceCallInput,
): Promise<VoiceCallResult> {
  return request(
    '/voice/calls',
    {
      method: 'POST',
      headers: bearer(accessToken),
      // snake_case here is the AGENT'S variable naming, not a house style:
      // Tensor-Core forwards these keys to Sarvam unchanged, so a rename on
      // the way through is a variable the agent does not have.
      body: JSON.stringify({
        customer_name: input.customerName,
        customer_number: input.customerNumber,
        product_name: input.productName,
        cart_value: input.cartValue,
        item_count: input.itemCount,
      }),
    },
    data => VoiceCallResultSchema.parse(data),
  )
}
