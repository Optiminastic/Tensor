import type { Metadata } from 'next'
import type { JSX } from 'react'

import { CardGridSection } from '@/components/landing/card-grid-section'
import { INTEGRATION_GROUPS } from '@/components/landing/content/integrations'
import { LogoStrip } from '@/components/landing/logo-strip'
import { SubpageShell } from '@/components/landing/subpage-shell'

export const metadata: Metadata = {
  title: 'Integrations',
  description:
    'The systems Tensor is connected to - Shopify, BambuBuddy, Bambu Lab, OpenSCAD, WhatsApp, Sarvam AI, Delhivery, Amazon S3 and Google - and exactly what each connection does.',
}

export default function IntegrationsPage(): JSX.Element {
  return (
    <SubpageShell
      eyebrow="Integrations"
      title="Connected to the tools the workshop already uses"
      intro="From the store to the printer to the courier, Tensor talks to each system directly and keeps them in step - here is exactly what every connection does."
    >
      <LogoStrip items={INTEGRATION_GROUPS.flatMap(g => g.items)} />
      {INTEGRATION_GROUPS.map(group => (
        <CardGridSection
          key={group.id}
          id={group.id}
          eyebrow={group.eyebrow}
          title={group.title}
          intro={group.intro}
          cards={group.items.map(item => ({
            title: item.name,
            description: item.summary,
            points: item.built,
            logo: item.logo,
            tag: item.tag,
          }))}
        />
      ))}
    </SubpageShell>
  )
}
