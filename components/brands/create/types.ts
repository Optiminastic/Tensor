import type { BrandCreateInput } from '@/lib/validators/brands'
import type { ConnectionProvider } from '@/lib/validators/connections'

/** The essentials collected in the first onboarding step. */
export interface BrandBasicsDraft {
  name: string
  slug: string
  description: string
  logoUrl: string | null
}

/** A per-provider connection captured during onboarding, persisted after create. */
export interface ConnectionDraft {
  connected: boolean
  externalAccountId: string
  accessToken: string
}

/**
 * The Shopify link captured in step 1 via OAuth. The token lives server-side
 * (encrypted cookie) and is persisted after create by finalizeShopifyConnection;
 * only these non-secret fields are held client-side. `shopUrl` becomes the
 * brand's shopify_url.
 */
export interface ShopifyDraft {
  connected: boolean
  domain: string
  shopUrl: string
}

export const EMPTY_SHOPIFY: ShopifyDraft = {
  connected: false,
  domain: '',
  shopUrl: '',
}

/** The non-secret prefill the create-brand page derives from the pending cookie. */
export interface ShopifyPrefill {
  shop: string
  name: string
  description: string
  logoUrl: string | null
  shopUrl: string
}

export type ConnectionDrafts = Record<ConnectionProvider, ConnectionDraft>

export const EMPTY_CONNECTION: ConnectionDraft = {
  connected: false,
  externalAccountId: '',
  accessToken: '',
}

// Onboarding keeps pricing out of the way: a brand is created with these
// sensible defaults, editable in full on the brand page afterwards.
export const DEFAULT_PRICING = {
  startingPrice: 999,
  ladder: [999, 1199, 1299, 1499, 1799, 1999, 2499, 2999, 3499, 3999],
  cpGreenMax: 0.25,
  cpYellowMax: 0.3,
}

/** Builds the create payload from the basics, the default pricing, and the store URL. */
export function toBrandCreateInput(
  basics: BrandBasicsDraft,
  shopUrl?: string | null,
): BrandCreateInput {
  return {
    name: basics.name,
    slug: basics.slug || undefined,
    logo_url: basics.logoUrl,
    description: basics.description || null,
    shopify_url: shopUrl || null,
    starting_price: DEFAULT_PRICING.startingPrice,
    ladder: DEFAULT_PRICING.ladder,
    cp_green_max: DEFAULT_PRICING.cpGreenMax,
    cp_yellow_max: DEFAULT_PRICING.cpYellowMax,
    is_active: true,
  }
}
