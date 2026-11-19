import type { Metadata } from 'next'
import type { JSX } from 'react'

import { FEATURE_GROUPS } from '@/components/landing/content/features'
import { LOGOS } from '@/components/landing/content/logos'
import { ContentSection } from '@/components/landing/content-section'
import { FeatureList } from '@/components/landing/feature-list'
import { Illustration } from '@/components/landing/illustration'
import { LogoGrid } from '@/components/landing/logo-grid'
import { SplitSection } from '@/components/landing/split-section'
import { SubpageShell } from '@/components/landing/subpage-shell'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Everything Tensor does for a 3D-printing workshop: slicer-based costing, a product registry, automatic jobs and models, colour-first batching, printing, fulfilment and a voice agent.',
}

/** Each feature group's illustration in public/illustrations, and what it shows. */
const ILLUSTRATIONS: Record<string, { src: string; alt: string }> = {
  designs: {
    src: '/illustrations/costing.svg',
    alt: 'A design sliced into layers and priced on the ladder',
  },
  registry: {
    src: '/illustrations/registry.svg',
    alt: 'One product split into parts, each filled from the order',
  },
  production: {
    src: '/illustrations/production.svg',
    alt: 'An order arriving and becoming jobs with 3D models',
  },
  printing: {
    src: '/illustrations/printing.svg',
    alt: 'Parts packed onto a print bed, largest first',
  },
  fulfilment: {
    src: '/illustrations/fulfilment.svg',
    alt: 'A parcel passing QC and packing on its way to the customer',
  },
  agent: {
    src: '/illustrations/agent.svg',
    alt: 'A voice agent greeting customers in their own language',
  },
  admin: { src: '/illustrations/workspace.svg', alt: 'Six roles around one protected workspace' },
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
      <Illustration
        src="/illustrations/pipeline.svg"
        alt="An order moving through Tensor: order, job, 3D model, print bed, printer, parcel"
      />
      {FEATURE_GROUPS.map((group, i) => (
        <SplitSection
          key={group.id}
          id={group.id}
          eyebrow={group.eyebrow}
          title={group.title}
          intro={group.intro}
          illustration={ILLUSTRATIONS[group.id]?.src ?? '/illustrations/pipeline.svg'}
          illustrationAlt={ILLUSTRATIONS[group.id]?.alt ?? ''}
          flip={i % 2 === 1}
        >
          <FeatureList items={group.items} />
        </SplitSection>
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
