import type { Metadata } from 'next'
import type { JSX } from 'react'

import { Bento } from '@/components/landing/bento'
import { MarketingPage } from '@/components/landing/marketing/marketing-page'
import { PrinciplesList } from '@/components/landing/marketing/principles-list'
import { RolesList } from '@/components/landing/marketing/roles-list'

export const metadata: Metadata = {
  title: 'About',
  description: 'What Tensor is, the rules it is built around, and who uses it.',
}

export default function AboutPage(): JSX.Element {
  return (
    <MarketingPage
      page="about"
      eyebrow="About Tensor"
      title="The costing and production system for 3D-printed goods"
      intro="Tensor works out what a print truly costs, prices it so the margin survives, and runs the floor that makes it. It is built by Optiminastic."
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 sm:py-24">
        <PrinciplesList />
        <RolesList />
        <Bento />
      </div>
    </MarketingPage>
  )
}
