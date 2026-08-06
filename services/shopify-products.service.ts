// Server-only by placement (called from server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type ShopifyProduct, ShopifyProductSchema } from '@/lib/validators/shopify-products'

const log = createLogger('ShopifyProductsService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's /brands/:slug/shopify-products endpoint - a
 * brand's connected store's product catalog, fetched live from Shopify.
 * Server-only; every call carries the caller's bearer token and the backend
 * enforces brand:read against it.
 */
export class ShopifyProductsServiceError extends Error {}

export async function listShopifyProducts(
  token: string,
  brandSlug: string,
): Promise<ShopifyProduct[]> {
  let response: Response
  const path = `/brands/${encodeURIComponent(brandSlug)}/shopify-products`
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ShopifyProductsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new ShopifyProductsServiceError(detail ?? `Request failed (${response.status})`)
  }

  return ShopifyProductSchema.array().parse(await response.json())
}
