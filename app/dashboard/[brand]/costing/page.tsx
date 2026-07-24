import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PriceCalculator } from '@/components/costing/price-calculator'

export const metadata: Metadata = { title: 'Costing' }

interface CostingPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Costing for a brand. The price calculator runs the pure pricing engine; cost
 * reports and pricing rules land here as they are built.
 */
export default async function CostingPage({ params }: CostingPageProps): Promise<JSX.Element> {
  const { brand } = await params
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Costing</h1>
        <p className="text-muted-foreground text-sm">
          Price a design against this brand: enter the slicer metrics and costs to get the Design
          CP, the recommended selling price and the pre-check.
        </p>
      </div>
      <PriceCalculator brand={brand} />
    </main>
  )
}
