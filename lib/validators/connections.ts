import { z } from 'zod'

/** The external platforms a brand can connect to. Mirrors the backend provider set. */
export const ConnectionProviderSchema = z.enum([
  'google_ads',
  'google_analytics',
  'meta_ads',
  'shopify',
])

/** A connection's lifecycle state. Mirrors the backend. */
export const ConnectionStatusSchema = z.enum(['connected', 'disconnected', 'error'])

/** A connection as returned by the backend. Tokens are never included. */
export const ConnectionSchema = z.object({
  id: z.string(),
  brand_slug: z.string(),
  provider: ConnectionProviderSchema,
  status: ConnectionStatusSchema,
  external_account_id: z.string().nullable(),
  expires_at: z.string().nullable(),
  connected_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * What the frontend persists after finishing a provider's flow. Tokens are
 * optional so a manual link (account id only) is valid while OAuth is scaffolded.
 */
export const ConnectionUpsertSchema = z.object({
  status: ConnectionStatusSchema,
  external_account_id: z.string().max(255).nullable().optional(),
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
})

/** Human labels for each provider, for UI. */
export const PROVIDER_LABELS: Record<ConnectionProvider, string> = {
  google_ads: 'Google Ads',
  google_analytics: 'Google Analytics',
  meta_ads: 'Meta Ads',
  shopify: 'Shopify',
}

export type ConnectionProvider = z.infer<typeof ConnectionProviderSchema>
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>
export type Connection = z.infer<typeof ConnectionSchema>
export type ConnectionUpsertInput = z.infer<typeof ConnectionUpsertSchema>

// shopifyConnectionResponse (internal/httpapi/shopify_oauth.go#listShopifyConnections) -
// the REAL order-import OAuth connections (separate from the Connection shape
// above: shopify_connections has no brand column, it's matched to a brand by
// shop domain, not by a brand_slug foreign key).
export const ShopifyOrderConnectionSchema = z.object({
  id: z.string(),
  shop_domain: z.string(),
  connected_at: z.string(),
})
export type ShopifyOrderConnection = z.infer<typeof ShopifyOrderConnectionSchema>

// syncShopifyConnection's response (internal/httpapi/shopify_oauth.go) - how
// many orders the on-demand catch-up import just pulled in from Shopify.
export const ShopifySyncResultSchema = z.object({
  imported: z.number(),
})
export type ShopifySyncResult = z.infer<typeof ShopifySyncResultSchema>
