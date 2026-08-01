'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { BrandDeleteRow } from '@/components/brands/brand-delete-row'
import type { BrandProfile } from '@/lib/validators/brands'

interface BrandDeleteListProps {
  brands: BrandProfile[]
}

/**
 * The deletable list of brands shown in Settings. Holds a local copy so a removed
 * brand disappears at once, and refreshes server data to keep other views in sync.
 */
export function BrandDeleteList({ brands }: BrandDeleteListProps): JSX.Element {
  const router = useRouter()
  const [items, setItems] = useState<BrandProfile[]>(brands)

  function handleDeleted(slug: string): void {
    setItems(prev => prev.filter(brand => brand.slug !== slug))
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No brands yet. Create one from the Brands page to start pricing.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map(brand => (
        <BrandDeleteRow key={brand.id} brand={brand} onDeleted={handleDeleted} />
      ))}
    </ul>
  )
}
