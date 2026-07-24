import type { JSX } from 'react'

import { ConnectionRow } from '@/components/brands/connection-row'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type Connection, type ConnectionProvider } from '@/lib/validators/connections'

const PROVIDERS: ConnectionProvider[] = ['google_ads', 'meta_ads', 'shopify']

interface BrandConnectionsProps {
  brandSlug: string
  connections: Connection[]
}

/**
 * The integrations panel for a brand: one row per provider (Google Ads, Meta
 * Ads, Shopify) showing whether it is connected and letting an admin link or
 * disconnect it.
 */
export function BrandConnections({ brandSlug, connections }: BrandConnectionsProps): JSX.Element {
  const byProvider = new Map(connections.map(c => [c.provider, c]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect this brand&apos;s ad and commerce platforms.</CardDescription>
      </CardHeader>
      <CardContent>
        {PROVIDERS.map(provider => (
          <ConnectionRow
            key={provider}
            brandSlug={brandSlug}
            provider={provider}
            connection={byProvider.get(provider) ?? null}
          />
        ))}
      </CardContent>
    </Card>
  )
}
