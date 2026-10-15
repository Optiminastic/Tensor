import type { Metadata } from 'next'
import type { JSX } from 'react'

import { IntegrationCard } from '@/components/landing/marketing/integration-card'
import { MarketingPage } from '@/components/landing/marketing/marketing-page'
import { INTEGRATIONS } from '@/lib/marketing/integrations'

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'The systems Tensor works with, and what it does with each.',
}

export default function IntegrationsPage(): JSX.Element {
  return (
    <MarketingPage
      page="integrations"
      eyebrow="Integrations"
      title="Works with the tools the floor already runs"
      intro="The store, the printers, the slicer, the courier and the customer's phone. Here is what Tensor does with each of them."
    >
      <ul className="mx-auto grid max-w-6xl gap-3 px-4 py-16 sm:grid-cols-2 sm:px-6 sm:py-24 lg:grid-cols-3">
        {INTEGRATIONS.map(integration => (
          <IntegrationCard key={integration.name} integration={integration} />
        ))}
      </ul>
    </MarketingPage>
  )
}
