import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'
import { ProductionOverview } from '@/components/production/production-overview'

export const metadata: Metadata = { title: 'Production' }

const VIEW_TITLES: Record<string, string> = {
  jobs: 'Production Jobs',
  batches: 'Batch Management',
  machines: 'Machine Management',
  inventory: 'Filament Inventory',
}

interface ProductionPageProps {
  searchParams: Promise<{ view?: string }>
}

export default async function ProductionPage({
  searchParams,
}: ProductionPageProps): Promise<JSX.Element> {
  const { view } = await searchParams
  const title = view ? VIEW_TITLES[view] : undefined

  if (title) {
    return <ComingSoon title={title} description={`${title} lands here next.`} />
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Production</h1>
        <p className="text-muted-foreground text-sm">
          Print queue, machines, and inventory at a glance.
        </p>
      </div>
      <ProductionOverview />
    </main>
  )
}
