import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { BrandConnections } from '@/components/brands/brand-connections'
import { BrandDeleteList } from '@/components/brands/brand-delete-list'
import { BrandEditor } from '@/components/brands/brand-editor'
import { ShopifyOrderImportStatus } from '@/components/brands/shopify-order-import-status'
import { isAllBrands } from '@/components/dashboard/nav-config'
import { SettingsTabs, type SettingsTab } from '@/components/settings/settings-tabs'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import { requirePermission } from '@/lib/authz'
import { env } from '@/lib/env'
import type { BrandProfile } from '@/lib/validators/brands'
import type { Connection } from '@/lib/validators/connections'
import { listBrands } from '@/services/brands.service'
import { listConnections, listShopifyOrderConnections } from '@/services/connections.service'

export const metadata: Metadata = { title: 'Settings' }

export const dynamic = 'force-dynamic'

// The OAuth round-trips redirect back here with a status query. They used to
// land on /dashboard/<brand>/integrations, which no longer exists.
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

interface SettingsPageProps {
  searchParams: Promise<{
    tab?: string
    brand?: string
    google?: string
    shopify?: string
    shopify_orders?: string
  }>
}

function tabFrom(raw: string | undefined, hasOAuthNotice: boolean): SettingsTab {
  if (raw === 'brand' || raw === 'integrations' || raw === 'workspace') return raw
  // A connection round-trip lands on the tab it came from, even without ?tab=.
  return hasOAuthNotice ? 'integrations' : 'workspace'
}

/**
 * Settings: workspace, the active brand, and that brand's connections.
 *
 * One page where there were three. The sidebar carried a workspace Settings, a
 * per-brand Settings and a separate Integrations area, so "where do I change
 * this" had three answers depending on which you happened to be in.
 *
 * The brand-scoped tabs follow the brand the user was last looking at - the
 * same `last_brand` cookie the dashboard layout reads - because this route has
 * no [brand] segment of its own. `?brand=` overrides it, which is what the
 * OAuth callbacks use to come back to the right store.
 */
export default async function SettingsPage({
  searchParams,
}: SettingsPageProps): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) redirect('/login?callbackUrl=/dashboard/settings')

  // Deleting brands, editing a brand's pricing ladder and connecting its store
  // are all brand:manage acts, and this page had no permission check at all -
  // any signed-in role could open it. Tensor-Core refused the writes, so this
  // closes a UI hole rather than a security one, but a Designer being shown a
  // "Delete brand" button is its own kind of wrong.
  await requirePermission('brand:manage', '/dashboard')

  const {
    tab,
    brand: brandParam,
    google,
    shopify,
    shopify_orders: shopifyOrders,
  } = await searchParams
  const notice = google
    ? GOOGLE_NOTICES[google]
    : shopify
      ? SHOPIFY_NOTICES[shopify]
      : shopifyOrders
        ? SHOPIFY_ORDERS_NOTICES[shopifyOrders]
        : undefined
  const active = tabFrom(tab, Boolean(google ?? shopify ?? shopifyOrders))

  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  const activeBrand = brandParam ?? (isAllBrands(lastBrand) ? null : lastBrand)

  const token = await getTokenSafe(requestHeaders)
  let brands: BrandProfile[] = []
  let loadError: string | null = null
  try {
    if (token?.token) brands = await listBrands(token.token)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load brands.'
  }
  const profile = activeBrand ? brands.find(b => b.slug === activeBrand) : undefined

  let connections: Connection[] = []
  let shopifyShopDomain: string | null = null
  let orderImportMissing = false
  if (token?.token && profile) {
    connections = await listConnections(token.token, profile.slug).catch(() => [])
    shopifyShopDomain =
      connections.find(c => c.provider === 'shopify' && c.status === 'connected')
        ?.external_account_id ?? null
    // Nudge only when the store is connected for products but has not finished
    // the separate order-import grant. Any failure means no nudge: UX only.
    if (shopifyShopDomain) {
      try {
        const orderConnections = await listShopifyOrderConnections(token.token)
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
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Settings</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          Workspace, {profile ? profile.name : 'brand'} and its connections.
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

      <SettingsTabs
        active={active}
        workspace={
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle>Brands</CardTitle>
                  <CardDescription>
                    Delete a brand and everything it owns. To edit a brand&apos;s ladder or
                    thresholds, use the Brand tab.
                  </CardDescription>
                </div>
                <Link
                  href="/dashboard/brands"
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                >
                  Manage brands
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadError ? (
                <p
                  role="alert"
                  className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
                >
                  {loadError}
                </p>
              ) : (
                <BrandDeleteList brands={brands} />
              )}
            </CardContent>
          </Card>
        }
        brand={
          profile ? (
            <BrandEditor brand={profile} />
          ) : (
            <NoBrandChosen what="Brand settings" why="identity, pricing ladder and CP thresholds" />
          )
        }
        integrations={
          profile ? (
            <div className="flex flex-col gap-8">
              <BrandConnections
                brandSlug={profile.slug}
                connections={connections}
                googleOAuthConfigured={googleOAuthConfigured}
              />
              {orderImportMissing && shopifyShopDomain ? (
                <ShopifyOrderImportStatus brandSlug={profile.slug} shopDomain={shopifyShopDomain} />
              ) : null}
            </div>
          ) : (
            <NoBrandChosen what="Integrations" why="connections belong to one brand's store" />
          )
        }
      />
    </main>
  )
}

interface NoBrandChosenProps {
  what: string
  why: string
}

/** Both brand-scoped tabs need a brand; neither can guess which. */
function NoBrandChosen({ what, why }: NoBrandChosenProps): JSX.Element {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-6">
        <p className="text-sm">
          {what} apply to one brand — {why}.
        </p>
        <p className="text-muted-foreground text-sm">
          Open a brand from the switcher, then come back here.
        </p>
        <Link
          href="/dashboard/brands"
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          Choose a brand
        </Link>
      </CardContent>
    </Card>
  )
}
