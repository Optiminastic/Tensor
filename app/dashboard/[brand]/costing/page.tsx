import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PriceCalculator } from '@/components/costing/price-calculator'
import { PricingRulesDialog } from '@/components/costing/pricing-rules-dialog'
import { resolveBackendToken } from '@/lib/backend-token'
import type { CostAssumption } from '@/lib/validators/config'
import { ConfigServiceError, getDefaultCostAssumption } from '@/services/config.service'

export const metadata: Metadata = { title: 'Costing' }

interface CostingPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ view?: string }>
}

/**
 * Costing for a brand. The price calculator runs the pure pricing engine; the
 * pricing-rules view (?view=rules) edits the admin cost assumptions that drive
 * Design CP and the selling price.
 */
export default async function CostingPage({
  params,
  searchParams,
}: CostingPageProps): Promise<JSX.Element> {
  const { brand } = await params
  const { view } = await searchParams

  if (view === 'rules') return <PricingRulesView />

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

async function PricingRulesView(): Promise<JSX.Element> {
  const { token, error } = await resolveBackendToken()

  let initial: CostAssumption | null = null
  let loadError = token ? null : (error ?? 'Your session has expired. Sign in again.')
  if (token) {
    try {
      initial = await getDefaultCostAssumption(token)
    } catch (err) {
      loadError =
        err instanceof ConfigServiceError ? err.message : 'Could not load the pricing rules.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Pricing rules</h1>
        <p className="text-muted-foreground text-sm">
          The cost assumptions every design is priced against. Change them and the next slice
          reprices - the selling price is driven by these values, not hardcoded.
        </p>
      </div>
      {loadError ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {loadError}
        </p>
      ) : (
        <PricingRulesDialog initial={initial} />
      )}
    </main>
  )
}
