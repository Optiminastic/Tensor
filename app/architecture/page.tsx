import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AlgorithmPanel } from '@/components/landing/algorithm-panel'
import {
  ALGORITHMS,
  ARCH_SECTIONS,
  ORDER_FLOW,
  PRACTICES,
  SYSTEM_PARTS,
  TECH_STACK,
} from '@/components/landing/content/architecture'
import { ContentSection } from '@/components/landing/content-section'
import { FlowSteps } from '@/components/landing/flow-steps'
import { Illustration } from '@/components/landing/illustration'
import { RuledList } from '@/components/landing/ruled-list'
import { SubpageShell } from '@/components/landing/subpage-shell'
import { TechGrid } from '@/components/landing/tech-grid'

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'How Tensor is built: the order-to-doorstep pipeline, the services and workers, the algorithms behind bed packing, batching and costing, the engineering practices, and the full tech stack.',
}

const SYSTEM_ITEMS = SYSTEM_PARTS.map(p => ({
  title: p.name,
  description: p.role,
  points: p.details,
}))
const PRACTICE_ITEMS = PRACTICES.map(p => ({ title: p.title, description: p.detail }))

export default function ArchitecturePage(): JSX.Element {
  return (
    <SubpageShell
      eyebrow="Architecture"
      title="How Tensor is built"
      intro="A Go backend that owns every rule, a Next.js app that renders it, workers that do the heavy lifting on queues, and one PostgreSQL database underneath."
    >
      <ContentSection {...ARCH_SECTIONS.system}>
        <Illustration
          framed
          src="/illustrations/system.svg"
          alt="The web app calls the Go API; the API and four workers share one PostgreSQL database holding the data and work queues; workers talk to storage, the print farm and customers"
        />
        <RuledList items={SYSTEM_ITEMS} />
      </ContentSection>
      <ContentSection {...ARCH_SECTIONS.flow}>
        <FlowSteps steps={ORDER_FLOW} />
      </ContentSection>
      <ContentSection {...ARCH_SECTIONS.algorithms}>
        <AlgorithmPanel items={ALGORITHMS} />
      </ContentSection>
      <ContentSection {...ARCH_SECTIONS.practices}>
        <RuledList items={PRACTICE_ITEMS} columns={2} />
      </ContentSection>
      <ContentSection {...ARCH_SECTIONS.stack}>
        <TechGrid groups={TECH_STACK} />
      </ContentSection>
    </SubpageShell>
  )
}
