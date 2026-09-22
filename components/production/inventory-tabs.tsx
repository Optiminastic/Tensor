'use client'

import { useState, type JSX } from 'react'

import { ColourMapView } from '@/components/production/colour-map-view'
import { FilamentInventory } from '@/components/production/filament-inventory'
import { InventoryItemsTable } from '@/components/production/inventory-items-table'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { useQueryTab } from '@/hooks/use-query-tab'
import type { ColourMapEntry, LoadedColour } from '@/lib/validators/colour-map'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { Filament } from '@/lib/validators/production'

interface InventoryTabsProps {
  brand: string
  filaments: Filament[]
  items: InventoryItem[]
  colourMap: ColourMapEntry[]
  /** Spools loaded in the fleet that Tensor cannot name yet. */
  loadedColours: LoadedColour[]
}

const FILAMENT_TAB = 'filament'
const OTHERS_TAB = 'others'
const COLOURS_TAB = 'colours'

/**
 * The two shelves, under one page.
 *
 * They are genuinely different things rather than two filters over one list:
 * filament is measured in grams, reserved by the batch planner and synced from
 * BambuBuddy, while everything else is counted in boxes and touched only by
 * hand. Splitting them by tab keeps each table honest about what it holds
 * instead of leaving half the columns blank on every row.
 *
 * Filament stays the default because it is what the floor runs out of.
 */
export function InventoryTabs({
  brand,
  filaments,
  items,
  colourMap,
  loadedColours,
}: InventoryTabsProps): JSX.Element {
  const [tab, setTab] = useQueryTab<string>('tab', FILAMENT_TAB)

  const tabs: TabItem[] = [
    { value: FILAMENT_TAB, label: 'Filament', count: filaments.length },
    { value: OTHERS_TAB, label: 'Others', count: items.length },
    // Counted by the spools still UNNAMED, not by every loaded spool and not by
    // entries recorded: the number that matters is the work left, and a colour
    // nobody has named is a bed that cannot be matched to a machine.
    {
      value: COLOURS_TAB,
      label: 'Colour map',
      count: loadedColours.filter(c => c.mapped_as === '').length,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={tab} onValueChange={setTab} label="Choose an inventory shelf" />
      {tab === FILAMENT_TAB ? <FilamentInventory brand={brand} filaments={filaments} /> : null}
      {tab === OTHERS_TAB ? <InventoryItemsTable brand={brand} items={items} /> : null}
      {tab === COLOURS_TAB ? (
        <ColourMapView brand={brand} entries={colourMap} loaded={loadedColours} />
      ) : null}
    </div>
  )
}
