import type { JSX } from 'react'

import type { Design } from '@/lib/validators/designs'

import { DesignCard } from './design-card'

interface DesignGridProps {
  designs: Design[]
  // In the global "all brands" view, label each card with the brand it belongs to.
  showBrand: boolean
}

/** The designs as a grid of cover cards, each linking to its pre-check under its
 * own brand. Delete and archive live on the design's Settings tab, not here. */
export function DesignGrid({ designs, showBrand }: DesignGridProps): JSX.Element {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {designs.map(design => (
        <li key={design.id}>
          <DesignCard design={design} showBrand={showBrand} />
        </li>
      ))}
    </ul>
  )
}
