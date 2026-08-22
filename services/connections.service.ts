import { z } from 'zod'

import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type Connection,
  type ConnectionProvider,
  ConnectionSchema,
  type ConnectionUpsertInput,
  type ShopifyOrderConnection,
  ShopifyOrderConnectionSchema,
  type ShopifySyncResult,
  ShopifySyncResultSchema,
} from '@/lib/validators/connections'

const log = createLogger('ConnectionService')

const TIMEOUT_MS = 5_000

// The order import walks the store's Shopify orders and writes each one, so it
// runs far longer than the CRUD calls above. Aborting it early is not just a
// slow-request problem: the abort cancels the backend's request context, so
// every order still in flight fails with "context canceled" and the batch is
// lost. Kept in step with Tensor-Core's 60s HTTP write timeout
// (HTTP_WRITE_TIMEOUT_SECONDS) - raise both together if a store needs longer.
const SYNC_TIMEOUT_MS = 60_000

/**
 * Typed client for Tensor-Core's /brands/:slug/connections endpoints.
 *
 * Server-only. Every call carries the admin's bearer token; the backend enforces
 * `brand:read` / `brand:manage`. Tokens are written but never read back, so the
 * response shape here never carries them.
 */

export class ConnectionServiceError extends Error {}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (data: unknown) => T,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      // The default deadline every call gets. A call that legitimately runs
      // longer passes its own signal in `init` - see syncShopifyOrders.
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...init,
      cache: 'no-store',
    })
  } catch (error) {
    // A timeout means the backend took the request and then took too long,
    // which is a different fix from it being down - say so, or the operator
    // restarts a backend that was never the problem.
    if (error instanceof Error && error.name === 'TimeoutError') {
      log.error({ path, err: error }, 'Tensor-Core timed out')
      throw new ConnectionServiceError('Tensor-Core did not respond in time.')
    }
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ConnectionServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new ConnectionServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function bearer(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function listConnections(
  accessToken: string,
  brandSlug: string,
): Promise<Connection[]> {
  return request(
    `/brands/${encodeURIComponent(brandSlug)}/connections`,
    { headers: bearer(accessToken) },
    data => ConnectionSchema.array().parse(data),
  )
}

interface UpsertConnectionParams {
  brandSlug: string
  provider: ConnectionProvider
  input: ConnectionUpsertInput
}

export async function upsertConnection(
  accessToken: string,
  { brandSlug, provider, input }: UpsertConnectionParams,
): Promise<Connection> {
  return request(
    `/brands/${encodeURIComponent(brandSlug)}/connections/${provider}`,
    { method: 'PUT', headers: bearer(accessToken), body: JSON.stringify(input) },
    data => ConnectionSchema.parse(data),
  )
}

// listShopifyOrderConnections calls Tensor-Core's /integrations/shopify (the
// REAL order-import connections, gated by integration:manage - a different
// permission than the brand connections above). Used only to check whether a
// brand's store already completed that OAuth grant, so the Integrations page
// can show a reconnect link when it hasn't.
export async function listShopifyOrderConnections(
  accessToken: string,
): Promise<ShopifyOrderConnection[]> {
  return request('/integrations/shopify', { headers: bearer(accessToken) }, data =>
    ShopifyOrderConnectionSchema.array().parse(data),
  )
}

// syncShopifyOrders imports the brand's most recent Shopify orders (POST
// /brands/:slug/connections/shopify/sync), using the access token already
// stored on the brand's Shopify connection - the same one the existing
// product-catalog OAuth flow wrote. No separate order-import grant needed.
// This is the only ongoing path orders take into Tensor: the Orders page's
// "Sync from Shopify" button calls it, and nothing imports on its own.
export async function syncShopifyOrders(
  accessToken: string,
  brandSlug: string,
): Promise<ShopifySyncResult> {
  return request(
    `/brands/${encodeURIComponent(brandSlug)}/connections/shopify/sync`,
    {
      method: 'POST',
      headers: bearer(accessToken),
      signal: AbortSignal.timeout(SYNC_TIMEOUT_MS),
    },
    data => ShopifySyncResultSchema.parse(data),
  )
}

const ShopifyAuthorizeSchema = z.object({ authorize_url: z.string().url() })

/**
 * Fetches the Shopify OAuth authorize URL for connecting a brand's store (with
 * publish scopes). The browser cannot call the guarded backend directly, so a
 * server route calls this with the admin's token, then redirects to the URL.
 */
export async function getShopifyAuthorizeUrl(
  accessToken: string,
  brandSlug: string,
  shopDomain: string,
): Promise<string> {
  const query = new URLSearchParams({ shop_domain: shopDomain }).toString()
  return request(
    `/brands/${encodeURIComponent(brandSlug)}/connections/shopify/authorize?${query}`,
    { headers: bearer(accessToken) },
    data => ShopifyAuthorizeSchema.parse(data).authorize_url,
  )
}

export async function deleteConnection(
  accessToken: string,
  brandSlug: string,
  provider: ConnectionProvider,
): Promise<void> {
  await request(
    `/brands/${encodeURIComponent(brandSlug)}/connections/${provider}`,
    { method: 'DELETE', headers: bearer(accessToken) },
    () => undefined,
  )
}
