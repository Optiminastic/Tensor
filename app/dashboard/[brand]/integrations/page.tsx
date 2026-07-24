import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { JSX } from 'react'

import { BrandConnections } from '@/components/brands/brand-connections'
import { auth } from '@/lib/auth'
import type { Connection } from '@/lib/validators/connections'
import { listConnections } from '@/services/connections.service'

export const metadata: Metadata = { title: 'Integrations' }

export const dynamic = 'force-dynamic'

interface IntegrationsPageProps {
  params: Promise<{ brand: string }>
}

/**
 * This brand's ad and commerce connections (Shopify, Google Ads, Meta Ads).
 * Connecting or disconnecting is enforced by Tensor-Core (`brand:manage`).
 */
export default async function IntegrationsPage({
  params,
}: IntegrationsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  const token = await auth.api.getToken({ headers: await headers() })
  let connections: Connection[] = []
  if (token?.token) {
    connections = await listConnections(token.token, brand).catch(() => [])
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect this brand&apos;s ad and commerce platforms.
        </p>
      </div>
      <BrandConnections brandSlug={brand} connections={connections} />
    </main>
  )
}
