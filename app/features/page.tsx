import type { Metadata } from 'next'
import type { JSX } from 'react'

import { CardGridSection } from '@/components/landing/card-grid-section'
import { FEATURE_GROUPS, FEATURE_HIGHLIGHTS } from '@/components/landing/content/features'
import { LOGOS } from '@/components/landing/content/logos'
import { ContentSection } from '@/components/landing/content-section'
import { FeatureHighlights } from '@/components/landing/feature-highlights'
import { LogoGrid } from '@/components/landing/logo-grid'
import { SubpageShell } from '@/components/landing/subpage-shell'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Everything Tensor does for a 3D-printing workshop: slicer-based costing, a product registry, automatic jobs and models, colour-first batching, printing, fulfilment and a voice agent.',
}

const DEPENDENCIES = [
  { logo: LOGOS.shopify, role: 'Orders, products, bundles and abandoned checkouts' },
  { logo: LOGOS.bambubuddy, role: 'The print farm: fleet, queue, history and camera' },
  { logo: LOGOS.bambulab, role: 'The printers, and Bambu Studio for slicing' },
  { logo: LOGOS.openscad, role: 'Renders each personalised model from its design file' },
  { logo: LOGOS.sarvam, role: 'The voice agent for abandoned checkouts' },
  { logo: LOGOS.whatsapp, role: 'Confirmation links, the bot and damage claims' },
  { logo: LOGOS.delhivery, role: 'Shipments, tracking, NDR and reverse pickups' },
  { logo: LOGOS.s3, role: 'Design files, models and merged plates' },
]

export default function FeaturesPage(): JSX.Element {
  return (
    <SubpageShell
      eyebrow="Features"
      title="Everything a print farm runs on, in one place"
      intro="Tensor takes a design from upload to a costed product, an order to a print-ready model, a model to a packed bed, and a parcel to the customer's door."
    >
      <FeatureHighlights items={FEATURE_HIGHLIGHTS} />
      {FEATURE_GROUPS.map(group => (
        <CardGridSection
          key={group.id}
          id={group.id}
          eyebrow={group.eyebrow}
          title={group.title}
          intro={group.intro}
          cards={group.items}
        />
      ))}
      <ContentSection
        id="dependencies"
        eyebrow="Built on"
        title="The systems these features stand on"
        intro="Tensor does not reinvent the printer, the store or the courier. It connects to the best tool for each and keeps them in step."
      >
        <LogoGrid items={DEPENDENCIES} />
      </ContentSection>
    </SubpageShell>
  )
}
