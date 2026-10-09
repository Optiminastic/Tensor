import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type AbandonedCheckoutsResponse,
  AbandonedCheckoutsResponseSchema,
} from '@/lib/validators/abandoned-checkouts'

const log = createLogger('AbandonedCheckoutsService')

/**
 * Longer than the usual 5s. This is a live passthrough to Shopify rather than a
 * read of Tensor's own database - two hops, and the far one is paginating.
 */
const TIMEOUT_MS = 20_000

/**
 * Typed client for Tensor-Core's abandoned-checkouts endpoint.
 *
 * Server-only. The call carries the user's bearer token; the backend enforces
 * `order:read` against it, which is the permission that already governs seeing
 * real customers' orders.
 */

export class AbandonedCheckoutsServiceError extends Error {}

/**
 * One brand's abandoned checkouts, newest first.
 *
 * `days` bounds the window; the backend defaults to 30, because this is a view
 * of recent activity rather than an archive.
 */
export async function listAbandonedCheckouts(
  accessToken: string,
  brand: string,
  days?: number,
): Promise<AbandonedCheckoutsResponse> {
  const query = days ? `?days=${days}` : ''
  const path = `/brands/${encodeURIComponent(brand)}/abandoned-checkouts${query}`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new AbandonedCheckoutsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status }, 'Tensor-Core rejected the request')
    // The backend's own sentence. A missing Shopify connection and a Shopify
    // scope refusal are different problems with different fixes, and only the
    // message distinguishes them.
    throw new AbandonedCheckoutsServiceError(detail ?? `Request failed (${response.status})`)
  }

  return AbandonedCheckoutsResponseSchema.parse(await response.json())
}
