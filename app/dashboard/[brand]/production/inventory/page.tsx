import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PageHeading } from '@/components/dashboard/page-heading'
import { InventoryTabs } from '@/components/production/inventory-tabs'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ColourMapEntry, LoadedColour } from '@/lib/validators/colour-map'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { Filament } from '@/lib/validators/production'
import {
  ColourMapServiceError,
  listColourMap,
  listLoadedColours,
} from '@/services/colour-map.service'
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
  let colourMap: ColourMapEntry[] = []
  let loadedColours: LoadedColour[] = []
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
    // The colour map and the unmapped spools travel together - one is the
    // record, the other is the work left - and both are read separately again
    // so a colour-map outage cannot blank the shelf an operator came for.
    try {
      ;[colourMap, loadedColours] = await Promise.all([
        listColourMap(token),
        listLoadedColours(token),
      ])
    } catch (err) {
      if (!error) {
        error =
          err instanceof ColourMapServiceError ? err.message : 'Could not load the colour map.'
      }
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : (
        <>
          <PageHeading
            eyebrow="Production"
            title="Inventory"
            description={<>Filament on the spool shelf, and everything else a plank ships with.</>}
          />
          <InventoryTabs
            brand={brand}
            filaments={filaments}
            items={items}
            colourMap={colourMap}
            loadedColours={loadedColours}
          />
        </>
      )}
    </main>
  )
}
