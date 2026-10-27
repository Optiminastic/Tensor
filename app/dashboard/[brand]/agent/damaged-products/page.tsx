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
 * Every customer who reported damage: the order they named, their number,
 * what they uploaded, and how far anybody has got with it.
 */
export default async function DamagedProductsPage({
  params,
}: DamagedProductsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('whatsapp:read', `/dashboard/${brand}`)
  const authz = await currentAuthz()
  // Deciding the OUTCOME is a different permission from moving a report along:
  // admin and customer support hold it, and nobody else does.
  const canResolve = can(authz, 'damage:resolve')
  // Separate from resolve on purpose: deciding what the shop does about a
  // complaint is the job, erasing the record that it happened is not.
  const canDelete = can(authz, 'damage:delete')

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
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <ProductionPageHeader
        eyebrow="Agent"
        title="Damaged Products"
        description="Customers who reported damage on WhatsApp, the photos and videos they uploaded, and what was done about it."
      />
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : (
        <DamagedProducts
          brand={brand}
          initial={reports}
          canResolve={canResolve}
          canDelete={canDelete}
        />
      )}
    </main>
  )
}
