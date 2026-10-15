import type { Metadata } from 'next'
import type { JSX } from 'react'

import { MarketingPage } from '@/components/landing/marketing/marketing-page'
import { StyleGuide } from '@/components/style-guide/style-guide'

export const metadata: Metadata = {
  title: 'Design system',
  description: 'The tokens and components Tensor is built from, in light and dark.',
}

export default function StyleGuidePage(): JSX.Element {
  return (
    <MarketingPage
      page="design-system"
      eyebrow="Design system"
      title="The parts Tensor is built from"
      intro="Every colour, face and component, rendered live from the real code. Use the switch in the header to see each one in light and dark."
    >
      <StyleGuide />
    </MarketingPage>
  )
}
