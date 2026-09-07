import type { Metadata } from 'next'
import type { JSX } from 'react'

import { InventoryTabs } from '@/components/production/inventory-tabs'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { Filament } from '@/lib/validators/production'
import { InventoryServiceError, listInventoryItems } from '@/services/inventory.service'
import { ProductionServiceError, listFilament } from '@/services/production.service'

export const metadata: Metadata = { title: 'Inventory' }

interface InventoryPageProps {
  params: Promise<{ brand: string }>
}

export default async function InventoryPage({ params }: InventoryPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('filament:read', `/dashboard/${brand}`)

  let filaments: Filament[] = []
  let items: InventoryItem[] = []
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
    // Fetched separately so one shelf failing does not blank the other - they
    // are different endpoints and a missing box count is no reason to hide the
    // filament the floor is about to run out of.
    try {
      items = await listInventoryItems(token)
    } catch (err) {
      if (!error) {
        error =
          err instanceof InventoryServiceError ? err.message : 'Could not load inventory items.'
      }
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-display text-3xl">Inventory</h1>
            <p className="text-muted-foreground text-sm">
              Filament on the spool shelf, and everything else a plank ships with.
            </p>
          </div>
          <InventoryTabs brand={brand} filaments={filaments} items={items} />
        </>
      )}
    </main>
  )
}
