'use client'

import { useState, type JSX } from 'react'

import { FilamentInventory } from '@/components/production/filament-inventory'
import { InventoryItemsTable } from '@/components/production/inventory-items-table'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { Filament } from '@/lib/validators/production'

interface InventoryTabsProps {
  brand: string
  filaments: Filament[]
  items: InventoryItem[]
}

const FILAMENT_TAB = 'filament'
const OTHERS_TAB = 'others'

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
export function InventoryTabs({ brand, filaments, items }: InventoryTabsProps): JSX.Element {
  const [tab, setTab] = useState(FILAMENT_TAB)

  const tabs: TabItem[] = [
    { value: FILAMENT_TAB, label: 'Filament', count: filaments.length },
    { value: OTHERS_TAB, label: 'Others', count: items.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={tab} onValueChange={setTab} label="Choose an inventory shelf" />
      {tab === FILAMENT_TAB ? (
        <FilamentInventory brand={brand} filaments={filaments} />
      ) : (
        <InventoryItemsTable brand={brand} items={items} />
      )}
    </div>
  )
}
