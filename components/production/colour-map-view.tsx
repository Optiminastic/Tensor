'use client'

import type { JSX } from 'react'

import { ColourMapTable } from '@/components/production/colour-map-table'
import { LoadedColoursPanel } from '@/components/production/loaded-colours-panel'
import type { ColourMapEntry, LoadedColour } from '@/lib/validators/colour-map'

interface ColourMapViewProps {
  brand: string
  entries: ColourMapEntry[]
  loaded: LoadedColour[]
}

/**
 * The colour map: what each shop colour name means to the printers.
 *
 * It exists because nothing else holds both halves. An order names a colour in
 * words; an AMS reports a bare hex with no name attached; and the built-in
 * table Tensor fell back on disagrees with the fleet — it calls blue #1560BD
 * where every blue spool here reports #2850E0. That mismatch is written into
 * each plate's filament declaration, which is the only colour signal BambuBuddy
 * reads, so it refused plates asking for a colour nobody owns.
 *
 * The loaded spools sit above the table on purpose: they are the work, and the
 * table is the record of work already done. Both are shown because they answer
 * different questions - what is in the machines right now, and what the shop
 * has ever agreed a colour means.
 */
export function ColourMapView({ brand, entries, loaded }: ColourMapViewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <LoadedColoursPanel brand={brand} loaded={loaded} entries={entries} />
      <ColourMapTable brand={brand} entries={entries} />
    </div>
  )
}
