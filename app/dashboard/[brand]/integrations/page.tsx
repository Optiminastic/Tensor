import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { JSX } from 'react'

import { BrandConnections } from '@/components/brands/brand-connections'
import { ShopifyOrderImportStatus } from '@/components/brands/shopify-order-import-status'
import { isAllBrands } from '@/components/dashboard/nav-config'
import { PickABrandNotice } from '@/components/dashboard/pick-a-brand-notice'
import { getTokenSafe } from '@/lib/auth'
import { requirePermission } from '@/lib/authz'
import { env } from '@/lib/env'
import type { Connection } from '@/lib/validators/connections'
import { listConnections, listShopifyOrderConnections } from '@/services/connections.service'

export const metadata: Metadata = { title: 'Integrations' }

export const dynamic = 'force-dynamic'

// The Google OAuth round-trip redirects back here with `?google=<status>`.
const GOOGLE_NOTICES: Record<string, { tone: 'success' | 'danger'; message: string }> = {
  connected: { tone: 'success', message: 'Google account connected.' },
  denied: { tone: 'danger', message: 'Google connection was cancelled.' },
  unconfigured: { tone: 'danger', message: 'Google OAuth is not configured on this server.' },
  invalid_request: { tone: 'danger', message: 'That Google connection request was invalid.' },
  error: { tone: 'danger', message: 'Could not connect the Google account. Please try again.' },
}

// The Shopify OAuth connect redirects back here with `?shopify=<status>`.
const SHOPIFY_NOTICES: Record<string, { tone: 'success' | 'danger'; message: string }> = {
  connected: { tone: 'success', message: 'Shopify store connected.' },
  invalid_request: {
    tone: 'danger',
    message: 'Enter your store domain (your-store.myshopify.com).',
  },
  error: { tone: 'danger', message: 'Could not connect Shopify. Please try again.' },
}

// Connecting Shopify during brand creation chains straight into the real
// order-import OAuth grant (see /api/shopify/orders/connect and
// internal/httpapi/shopify_oauth.go), which redirects back here with
// `?shopify_orders=<status>` once it's done.
const SHOPIFY_ORDERS_NOTICES: Record<string, { tone: 'success' | 'danger'; message: string }> = {
  connected: {
    tone: 'success',
    message: 'Shopify order import connected - paid and COD orders will flow in automatically.',
  },
  invalid_shop: { tone: 'danger', message: 'That doesn’t look like a Shopify store domain.' },
  invalid_request: {
    tone: 'danger',
    message: 'A shop domain is required to connect order import.',
  },
  error: { tone: 'danger', message: 'Could not connect Shopify order import. Please try again.' },
}

interface IntegrationsPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ google?: string; shopify?: string; shopify_orders?: string }>
}

/**
 * This brand's ad and commerce connections (Shopify, Google Ads, Google
 * Analytics, Meta Ads). Connecting or disconnecting is enforced by Tensor-Core
 * (`brand:manage`); Google connects via OAuth (see /api/google/oauth/*).
 */
export default async function IntegrationsPage({
  params,
  searchParams,
}: IntegrationsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('integration:manage', `/dashboard/${brand}`)
  if (isAllBrands(brand)) {
    return (
      <PickABrandNotice
        section="Integrations"
        reason="Connections are managed per brand's store."
      />
    )
  }
  const { google, shopify, shopify_orders: shopifyOrders } = await searchParams
  const token = await getTokenSafe(await headers())
  let connections: Connection[] = []
  if (token?.token) {
    connections = await listConnections(token.token, brand).catch(() => [])
  }

  // Nudge only when the store is connected for products (brand_connections
  // has a shop domain) but hasn't completed the real order-import OAuth
  // grant (shopify_connections, matched by that same domain - it carries no
  // brand column of its own). Any lookup failure (e.g. the viewer lacks
  // integration:manage) defaults to not showing the nudge - UX only, no need
  // to nag when we can't actually tell.
  const shopifyShopDomain =
    connections.find(c => c.provider === 'shopify' && c.status === 'connected')
      ?.external_account_id ?? null
  let orderImportMissing = false
  if (token?.token && shopifyShopDomain) {
    try {
      const orderConnections = await listShopifyOrderConnections(token.token)
      orderImportMissing = !orderConnections.some(
        c => c.shop_domain.toLowerCase() === shopifyShopDomain.toLowerCase(),
      )
    } catch {
      orderImportMissing = false
    }
  }

  const googleOAuthConfigured = Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET,
  )
  const notice = google
    ? GOOGLE_NOTICES[google]
    : shopify
      ? SHOPIFY_NOTICES[shopify]
      : shopifyOrders
        ? SHOPIFY_ORDERS_NOTICES[shopifyOrders]
        : undefined

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect this brand&apos;s ad and commerce platforms.
        </p>
      </div>
      {notice ? (
        <p
          role="status"
          className={
            notice.tone === 'success'
              ? 'border-success/40 bg-success/10 text-success rounded-md border px-4 py-3 text-sm'
              : 'border-danger/40 bg-danger/10 text-danger rounded-md border px-4 py-3 text-sm'
          }
        >
          {notice.message}
        </p>
      ) : null}
      <BrandConnections
        brandSlug={brand}
        connections={connections}
        googleOAuthConfigured={googleOAuthConfigured}
      />
      {orderImportMissing && shopifyShopDomain ? (
        <ShopifyOrderImportStatus brandSlug={brand} shopDomain={shopifyShopDomain} />
      ) : null}
    </main>
  )
}
