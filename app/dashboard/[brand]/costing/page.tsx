import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PricingRulesDialog } from '@/components/costing/pricing-rules-dialog'
import { SalesReport } from '@/components/costing/sales-report'
import { PageHeading } from '@/components/dashboard/page-heading'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { CostAssumption } from '@/lib/validators/config'
import { ConfigServiceError, getDefaultCostAssumption } from '@/services/config.service'

export const metadata: Metadata = { title: 'Costing' }

interface CostingPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ view?: string }>
}

/**
 * Costing for a brand. The default view is Cost Reports: the Shopify sales
 * summary - best-selling products, the revenue trend and headline figures. The
 * pricing-rules view (?view=rules) edits the admin cost assumptions.
 */
export default async function CostingPage({
  params,
  searchParams,
}: CostingPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('pricing:read', `/dashboard/${brand}`)
  const { view } = await searchParams

  if (view === 'rules') return <PricingRulesView />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <PageHeading
        eyebrow="Costing"
        title="Cost reports"
        description={
          <>
            Shopify sales at a glance: the best-selling products, the revenue trend and the headline
            figures.
          </>
        }
      />

      <SalesReport />
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageHeading
        eyebrow="Costing"
        title="Pricing rules"
        description={
          <>
            The cost assumptions every design is priced against. Change them and the next slice
            reprices - the selling price is driven by these values, not hardcoded.
          </>
        }
        actions={loadError ? undefined : <PricingRulesDialog initial={initial} />}
      />
      {loadError ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {loadError}
        </p>
      ) : null}
    </main>
  )
}
