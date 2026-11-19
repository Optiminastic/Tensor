import type { Metadata } from 'next'
import type { JSX } from 'react'

import { BeforeAfterList } from '@/components/landing/before-after-list'
import { CardGridSection } from '@/components/landing/card-grid-section'
import { BEFORE_AFTER, PRINCIPLES, ROLES } from '@/components/landing/content/about'
import { ContentSection } from '@/components/landing/content-section'
import { CtaBanner } from '@/components/landing/cta-banner'
import { SubpageShell } from '@/components/landing/subpage-shell'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Tensor is the operating system of a personalised 3D-printing workshop: one place for costing, production, printing, fulfilment and customers.',
}

const PRINCIPLE_CARDS = PRINCIPLES.map(p => ({
  title: p.title,
  description: p.detail,
  icon: p.icon,
}))
const ROLE_CARDS = ROLES.map(r => ({ title: r.title, description: r.does, icon: r.icon }))
const NEXT_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/architecture', label: 'Architecture' },
]

export default function AboutPage(): JSX.Element {
  return (
    <SubpageShell
      eyebrow="About Tensor"
      title="The operating system of a 3D-printing workshop"
      intro="Tensor was built by Optiminastic for a workshop that prints personalised products every day - to replace spreadsheets, copy-paste and guesswork with one system that knows every order from the design file to the doorstep."
    >
      <ContentSection
        id="why"
        eyebrow="Why it exists"
        title="A personalised print is a hundred small decisions"
        intro="Every order carries a customer’s name, a colour and a deadline. Getting it right means pricing it honestly, rendering the right model, packing the right bed and shipping the right parcel - many times a day. Tensor makes each of those decisions the same way every time."
      >
        <BeforeAfterList rows={BEFORE_AFTER} />
      </ContentSection>
      <CardGridSection
        id="principles"
        eyebrow="Principles"
        title="What it is built to do"
        intro="Four rules shape every screen and every line of the backend."
        columns={2}
        cards={PRINCIPLE_CARDS}
      />
      <CardGridSection
        id="people"
        eyebrow="Who uses it"
        title="Six roles, one system"
        intro="From the designer to the packer, everyone works in the same place - each with exactly the access their job needs."
        cards={ROLE_CARDS}
      />
      <CtaBanner
        title="See how it fits together"
        body="What it does, what it connects to, and how it is built."
        links={NEXT_LINKS}
      />
    </SubpageShell>
  )
}
