import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ProductionOverview } from '@/components/production/production-overview'
import { ProductionPageHeader } from '@/components/production/production-page-header'

export const metadata: Metadata = { title: 'Production' }

export default function ProductionPage(): JSX.Element {
  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Production"
        description="Print queue, machines, and inventory at a glance."
      />
      <ProductionOverview />
    </main>
  )
}
