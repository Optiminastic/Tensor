import type { Metadata } from 'next'
import type { JSX } from 'react'

import { FilamentInventoryView } from '@/components/production/filament-inventory-view'

export const metadata: Metadata = { title: 'Filament Inventory' }

export default function FilamentInventoryPage(): JSX.Element {
  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <FilamentInventoryView />
    </main>
  )
}
