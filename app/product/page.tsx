import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AreaDetail } from '@/components/landing/marketing/area-detail'
import { MarketingPage } from '@/components/landing/marketing/marketing-page'
import { PipelineFlow } from '@/components/landing/marketing/pipeline-flow'
import { AREAS } from '@/lib/marketing/areas'

export const metadata: Metadata = {
  title: 'Product',
  description: 'Every area of Tensor and what each page in it does.',
}

export default function ProductPage(): JSX.Element {
  return (
    <MarketingPage
      page="product"
      eyebrow="Product"
      title="Every page, and what it does"
      intro="Tensor is one dashboard in seven areas. Here is each of them, and every page inside them, in the order a design travels through."
    >
      <PipelineFlow />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {AREAS.map((area, index) => (
          <AreaDetail key={area.key} area={area} index={index} />
        ))}
      </div>
    </MarketingPage>
  )
}
