import type { JSX } from 'react'

import { ConnectionRow } from '@/components/brands/connection-row'
import { IntegrationRow } from '@/components/brands/integration-row'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type Connection, type ConnectionProvider } from '@/lib/validators/connections'
import type { Integration } from '@/lib/validators/integrations'

const PROVIDERS: ConnectionProvider[] = ['google_ads', 'google_analytics', 'meta_ads', 'shopify']

interface BrandConnectionsProps {
  brandSlug: string
  connections: Connection[]
  googleOAuthConfigured: boolean
  /**
   * Credential-based integrations - Delhivery, WhatsApp - which have no OAuth.
   *
   * Optional, and omitted on the brands list: that page renders one of these
   * per brand, so fetching them would be a request per row to show forms
   * nobody opened. Settings is where they are configured, and it has a brand
   * switcher.
   */
  integrations?: Integration[]
}

/**
 * The integrations panel for a brand.
 *
 * Two kinds of row, and they work differently on purpose. The platforms above
 * connect by OAuth: a button sends the admin to the provider and back. A
 * carrier has no such redirect - its settings are ids and keys copied out of
 * another console - so those rows expand into a form.
 *
 * Those credentials used to live in env/local.env and in Coolify, which meant
 * the shop could not change an integration without a deploy.
 */
export function BrandConnections({
  brandSlug,
  connections,
  googleOAuthConfigured,
  integrations = [],
}: BrandConnectionsProps): JSX.Element {
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
            googleOAuthConfigured={googleOAuthConfigured}
          />
        ))}

        {integrations.map(integration => (
          <IntegrationRow
            key={integration.provider}
            brandSlug={brandSlug}
            integration={integration}
          />
        ))}
      </CardContent>
    </Card>
  )
}
