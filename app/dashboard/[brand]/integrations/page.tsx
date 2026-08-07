import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { JSX } from 'react'

import { BrandConnections } from '@/components/brands/brand-connections'
import { getTokenSafe } from '@/lib/auth'
import { env } from '@/lib/env'
import type { Connection } from '@/lib/validators/connections'
import { listConnections } from '@/services/connections.service'

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

interface IntegrationsPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ google?: string }>
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
  const { google } = await searchParams
  const token = await getTokenSafe(await headers())
  let connections: Connection[] = []
  if (token?.token) {
    connections = await listConnections(token.token, brand).catch(() => [])
  }

  const googleOAuthConfigured = Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET,
  )
  const notice = google ? GOOGLE_NOTICES[google] : undefined

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
    </main>
  )
}
