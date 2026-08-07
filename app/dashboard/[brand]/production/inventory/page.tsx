import type { Metadata } from 'next'
import type { JSX } from 'react'

import { FilamentInventory } from '@/components/production/filament-inventory'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Filament } from '@/lib/validators/production'
import { ProductionServiceError, listFilament } from '@/services/production.service'

export const metadata: Metadata = { title: 'Filament Inventory' }

interface FilamentInventoryPageProps {
  params: Promise<{ brand: string }>
}

export default async function FilamentInventoryPage({
  params,
}: FilamentInventoryPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('filament:read', `/dashboard/${brand}`)

  let filaments: Filament[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      filaments = await listFilament(token)
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load filament.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <FilamentInventory brand={brand} filaments={filaments} />
      )}
    </main>
  )
}
