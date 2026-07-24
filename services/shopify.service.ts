import { createLogger } from '@/lib/logger'

const log = createLogger('ShopifyService')

const TIMEOUT_MS = 8_000
const API_VERSION = '2024-10'

/**
 * Minimal Shopify Admin API client used only to pull a brand's identity when an
 * admin connects their store during onboarding. Server-only. The access token is
 * an argument, never logged.
 */

export class ShopifyServiceError extends Error {}

export interface ShopProfileResult {
  name: string
  description: string
  logoUrl: string | null
  shopUrl: string
}

interface FetchShopProfileParams {
  shopDomain: string
  accessToken: string
}

// The Admin API's Shop object exposes name/description/url but no brand logo
// (brand assets are not part of the Admin schema), so the logo is uploaded by
// hand in the review step. description is null when the store has not set one.
const SHOP_QUERY = `{
  shop {
    name
    description
    url
    myshopifyDomain
  }
}`

/** Normalises "store", "https://store.myshopify.com/", etc. to "store.myshopify.com". */
function normaliseDomain(input: string): string {
  const trimmed = input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
  const host = trimmed.toLowerCase()
  return host.endsWith('.myshopify.com') ? host : `${host}.myshopify.com`
}

export async function fetchShopProfile({
  shopDomain,
  accessToken,
}: FetchShopProfileParams): Promise<ShopProfileResult> {
  const host = normaliseDomain(shopDomain)
  const url = `https://${host}/admin/api/${API_VERSION}/graphql.json`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: SHOP_QUERY }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ host, err: error }, 'Shopify is unreachable')
    throw new ShopifyServiceError('Could not reach Shopify. Check the store domain and try again.')
  }

  if (response.status === 401 || response.status === 403) {
    throw new ShopifyServiceError('Shopify rejected the access token. Check it and the app scopes.')
  }
  if (!response.ok) {
    log.warn({ host, status: response.status }, 'Shopify request failed')
    throw new ShopifyServiceError(`Shopify request failed (${response.status}).`)
  }

  const body: unknown = await response.json().catch(() => null)
  return parseShopProfile(body, host)
}

function parseShopProfile(body: unknown, host: string): ShopProfileResult {
  const shop = readShop(body)
  if (!shop) {
    log.warn({ host }, 'Shopify returned no shop data')
    throw new ShopifyServiceError('Shopify did not return store details. Check the app scopes.')
  }
  return {
    name: shop.name ?? '',
    description: shop.description ?? '',
    logoUrl: null,
    shopUrl: shop.url ?? `https://${shop.myshopifyDomain ?? host}`,
  }
}

interface ShopNode {
  name?: string | null
  description?: string | null
  url?: string | null
  myshopifyDomain?: string | null
}

// Reads data.shop defensively; the GraphQL envelope may carry an errors array.
function readShop(body: unknown): ShopNode | null {
  if (typeof body !== 'object' || body === null) return null
  const data = (body as { data?: { shop?: ShopNode | null } }).data
  return data?.shop ?? null
}

// --- Brand assets (Settings > Brand, via the Storefront API) -----------------

export interface BrandAssets {
  logoUrl: string | null
  description: string
}

/**
 * Best-effort read of the store's Brand assets (logo, slogan, short description)
 * from the Storefront API. Mints a short-lived storefront token with the admin
 * token first. Returns empty assets when the app lacks the storefront scope, no
 * brand is configured, or anything fails — the Admin-only profile still stands.
 * `host` must already be a normalised <handle>.myshopify.com.
 */
export async function fetchBrandAssets(host: string, adminToken: string): Promise<BrandAssets> {
  try {
    const storefrontToken = await mintStorefrontToken(host, adminToken)
    if (!storefrontToken) return { logoUrl: null, description: '' }
    return await queryStorefrontBrand(host, storefrontToken)
  } catch (error) {
    log.warn({ host, err: error }, 'Could not fetch brand assets')
    return { logoUrl: null, description: '' }
  }
}

const STOREFRONT_TOKEN_MUTATION = `mutation {
  storefrontAccessTokenCreate(input: { title: "Tensor onboarding" }) {
    storefrontAccessToken { accessToken }
    userErrors { message }
  }
}`

async function mintStorefrontToken(host: string, adminToken: string): Promise<string | null> {
  const response = await fetch(`https://${host}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: STOREFRONT_TOKEN_MUTATION }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) return null
  const body: unknown = await response.json().catch(() => null)
  const token = (
    body as {
      data?: { storefrontAccessTokenCreate?: { storefrontAccessToken?: { accessToken?: unknown } } }
    }
  )?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken
  return typeof token === 'string' && token !== '' ? token : null
}

const BRAND_QUERY = `{
  shop {
    brand {
      shortDescription
      slogan
      logo { image { url } }
      squareLogo { image { url } }
    }
  }
}`

async function queryStorefrontBrand(host: string, storefrontToken: string): Promise<BrandAssets> {
  const response = await fetch(`https://${host}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: BRAND_QUERY }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) return { logoUrl: null, description: '' }
  const body: unknown = await response.json().catch(() => null)
  return readBrand(body)
}

interface BrandNode {
  shortDescription?: string | null
  slogan?: string | null
  logo?: { image?: { url?: string | null } | null } | null
  squareLogo?: { image?: { url?: string | null } | null } | null
}

function readBrand(body: unknown): BrandAssets {
  const brand = (body as { data?: { shop?: { brand?: BrandNode | null } } })?.data?.shop?.brand
  if (!brand) return { logoUrl: null, description: '' }
  return { logoUrl: brandLogo(brand), description: brandDescription(brand) }
}

function brandLogo(brand: BrandNode): string | null {
  return brand.logo?.image?.url ?? brand.squareLogo?.image?.url ?? null
}

function brandDescription(brand: BrandNode): string {
  return brand.shortDescription ?? brand.slogan ?? ''
}
