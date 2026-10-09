import type { Metadata } from 'next'
import type { JSX } from 'react'

import { BrandConnections } from '@/components/brands/brand-connections'
import { ShopifyOrderImportStatus } from '@/components/brands/shopify-order-import-status'
import {
  NoBrandChosen,
  SettingsHeader,
  SettingsNotice,
} from '@/components/settings/settings-header'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import type { Connection } from '@/lib/validators/connections'
import type { Integration } from '@/lib/validators/integrations'
import { listConnections, listShopifyOrderConnections } from '@/services/connections.service'
import { listIntegrations } from '@/services/integrations.service'

import { loadSettingsContext } from '../settings-context'

export const metadata: Metadata = { title: 'Integrations' }

export const dynamic = 'force-dynamic'

const log = createLogger('IntegrationsPage')

// The OAuth round-trips redirect back here with a status query.
const GOOGLE_NOTICES: Record<string, { tone: 'success' | 'danger'; message: string }> = {
  connected: { tone: 'success', message: 'Google account connected.' },
  denied: { tone: 'danger', message: 'Google connection was cancelled.' },
  unconfigured: { tone: 'danger', message: 'Google OAuth is not configured on this server.' },
  invalid_request: { tone: 'danger', message: 'That Google connection request was invalid.' },
  error: { tone: 'danger', message: 'Could not connect the Google account. Please try again.' },
}

const SHOPIFY_NOTICES: Record<string, { tone: 'success' | 'danger'; message: string }> = {
  connected: { tone: 'success', message: 'Shopify store connected.' },
  invalid_request: {
    tone: 'danger',
    message: 'Enter your store domain (your-store.myshopify.com).',
  },
  error: { tone: 'danger', message: 'Could not connect Shopify. Please try again.' },
  // Not a transient failure, so it must not say "try again": this
  // deployment has no one-click authorize endpoint, and the token field
  // under Advanced is the way through.
  unavailable: {
    tone: 'danger',
    message:
      'One-click Shopify connect is not available on this deployment. ' +
      'Open Shopify below, choose "Advanced: paste an access token instead", ' +
      'and paste a custom-app Admin API token for the store.',
  },
}

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
  searchParams: Promise<{
    brand?: string
    google?: string
    shopify?: string
    shopify_orders?: string
  }>
}

/**
 * Settings → Integrations: this brand's ad, commerce and carrier connections.
 *
 * Its own route rather than a tab, which is what lets the OAuth callbacks come
 * back to a real URL instead of reconstructing a tab from a query string.
 */
export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps): Promise<JSX.Element> {
  const { brand, google, shopify, shopify_orders: shopifyOrders } = await searchParams
  const { token, profile } = await loadSettingsContext(brand, '/dashboard/settings/integrations')

  const notice = google
    ? GOOGLE_NOTICES[google]
    : shopify
      ? SHOPIFY_NOTICES[shopify]
      : shopifyOrders
        ? SHOPIFY_ORDERS_NOTICES[shopifyOrders]
        : undefined

  let connections: Connection[] = []
  let integrations: Integration[] = []
  let integrationsError: string | null = null
  let shopifyShopDomain: string | null = null
  let orderImportMissing = false
  if (token && profile) {
    connections = await listConnections(token, profile.slug).catch(() => [])
    // Catches rather than throws - the OAuth half of this page is still worth
    // showing when the carrier lookup fails - but it SAYS SO. Returning an
    // empty list quietly is how three configured integrations came to be
    // missing from this card with nothing on the page, in the log or in the
    // API to suggest anything had gone wrong: the backend answered 200 and
    // the page drew four rows instead of seven.
    integrations = await listIntegrations(token, profile.slug).catch((error: unknown) => {
      integrationsError = error instanceof Error ? error.message : String(error)
      log.error({ brand: profile.slug, err: error }, 'Could not load credential integrations')
      return []
    })
    shopifyShopDomain =
      connections.find(c => c.provider === 'shopify' && c.status === 'connected')
        ?.external_account_id ?? null
    // Nudge only when the store is connected for products but has not finished
    // the separate order-import grant. Any failure means no nudge: UX only.
    if (shopifyShopDomain) {
      try {
        const orderConnections = await listShopifyOrderConnections(token)
        orderImportMissing = !orderConnections.some(
          c => c.shop_domain.toLowerCase() === shopifyShopDomain?.toLowerCase(),
        )
      } catch {
        orderImportMissing = false
      }
    }
  }

  const googleOAuthConfigured = Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET,
  )

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <SettingsHeader
        title="Integrations"
        description={
          profile
            ? `Connect ${profile.name}'s ad, commerce and carrier platforms.`
            : "Connect a brand's ad, commerce and carrier platforms."
        }
      />

      {notice ? <SettingsNotice tone={notice.tone}>{notice.message}</SettingsNotice> : null}

      {/* Named, not hidden. The carrier and messaging integrations are rows in
          the same card as the OAuth ones, so when the lookup fails the card
          looks complete and is not - and the only symptom is an integration
          somebody configured having apparently vanished. */}
      {integrationsError ? (
        <SettingsNotice tone="danger">
          {`Could not load the carrier and messaging integrations: ${integrationsError}`}
        </SettingsNotice>
      ) : null}

      {profile ? (
        <div className="flex flex-col gap-8">
          <BrandConnections
            brandSlug={profile.slug}
            connections={connections}
            googleOAuthConfigured={googleOAuthConfigured}
            integrations={integrations}
          />
          {orderImportMissing && shopifyShopDomain ? (
            <ShopifyOrderImportStatus brandSlug={profile.slug} shopDomain={shopifyShopDomain} />
          ) : null}
        </div>
      ) : (
        <NoBrandChosen what="Integrations" why="connections belong to one brand's store" />
      )}
    </main>
  )
}
