import { Cpu, Layers, Monitor, Printer, Server, Workflow } from 'lucide-react'
import type { Metadata } from 'next'
import type { JSX } from 'react'

import { CardGridSection } from '@/components/landing/card-grid-section'
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
import { SubpageShell } from '@/components/landing/subpage-shell'
import { TechGrid } from '@/components/landing/tech-grid'

export const metadata: Metadata = {
  title: 'Architecture',
  description:
    'How Tensor is built: the order-to-doorstep pipeline, the services and workers, the algorithms behind bed packing, batching and costing, the engineering practices, and the full tech stack.',
}

const PART_ICONS = [Monitor, Server, Cpu, Layers, Printer, Workflow]

const SYSTEM_CARDS = SYSTEM_PARTS.map((part, i) => ({
  title: part.name,
  description: part.role,
  points: part.details,
  icon: PART_ICONS[i % PART_ICONS.length],
}))
const ALGORITHM_CARDS = ALGORITHMS.map(a => ({ title: a.name, description: a.how, tag: a.where }))
const PRACTICE_CARDS = PRACTICES.map(p => ({ title: p.title, description: p.detail }))

export default function ArchitecturePage(): JSX.Element {
  return (
    <SubpageShell
      eyebrow="Architecture"
      title="How Tensor is built"
      intro="A Go backend that owns every rule, a Next.js app that renders it, workers that do the heavy lifting on queues, and one PostgreSQL database underneath."
    >
      <ContentSection {...ARCH_SECTIONS.flow}>
        <FlowSteps steps={ORDER_FLOW} />
      </ContentSection>
      <CardGridSection {...ARCH_SECTIONS.system} cards={SYSTEM_CARDS} />
      <CardGridSection {...ARCH_SECTIONS.algorithms} columns={2} cards={ALGORITHM_CARDS} />
      <CardGridSection {...ARCH_SECTIONS.practices} columns={2} cards={PRACTICE_CARDS} />
      <ContentSection {...ARCH_SECTIONS.stack}>
        <TechGrid groups={TECH_STACK} />
      </ContentSection>
    </SubpageShell>
  )
}
