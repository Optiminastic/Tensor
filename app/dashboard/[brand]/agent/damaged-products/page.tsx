import type { Metadata } from 'next'
import type { JSX } from 'react'

import { DamagedProducts } from '@/components/agent/damaged-products'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { DamageReports } from '@/lib/validators/whatsapp-damage'
import { DamageServiceError, listDamageReports } from '@/services/whatsapp-damage.service'

export const metadata: Metadata = { title: 'Damaged Products' }

export const dynamic = 'force-dynamic'

interface DamagedProductsPageProps {
  params: Promise<{ brand: string }>
}

const EMPTY: DamageReports = { items: [], counts: {} }

/**
 * Every customer who told the WhatsApp bot their order arrived damaged: the
 * order, their number, whether their photographs reached us, and how far
 * anybody has got with it.
 */
export default async function DamagedProductsPage({
  params,
}: DamagedProductsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('whatsapp:read', `/dashboard/${brand}`)
  const canUpdate = can(await currentAuthz(), 'whatsapp:reply')

  let reports: DamageReports = EMPTY
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      reports = await listDamageReports(token, brand)
    } catch (err) {
      error = err instanceof DamageServiceError ? err.message : 'Could not load damage reports.'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProductionPageHeader
        title="Damaged Products"
        description="Customers who reported damage on WhatsApp, the photographs they sent, and what was done about it."
      />
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : (
        <DamagedProducts brand={brand} initial={reports} canUpdate={canUpdate} />
      )}
    </div>
  )
}
