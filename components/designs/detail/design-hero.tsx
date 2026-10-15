import type { JSX } from 'react'

import type { DesignDetail } from '@/lib/validators/designs'

import { DesignStatusBadge } from '../design-status-badge'

import { DesignCover } from './design-cover'
import { DesignHeaderActions } from './design-header-actions'
import { printSpecs, productSpecs } from './design-specs'
import { SpecChips } from './spec-chips'

interface DesignHeroProps {
  brand: string
  design: DesignDetail
  onChanged: () => void
}

/** The design's heading: its cover beside the name, the specs and the actions. */
export function DesignHero({ brand, design, onChanged }: DesignHeroProps): JSX.Element {
  const product = productSpecs(design.attributes)
  return (
    <header className="grid items-center gap-6 sm:grid-cols-[minmax(0,200px)_1fr] lg:grid-cols-[minmax(0,240px)_1fr]">
      <div className="max-w-40 sm:max-w-60">
        <DesignCover designId={design.id} hasPreview={design.has_preview} />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
            <span aria-hidden className="mr-2">
              •
            </span>
            {design.sku ? `Design · ${design.sku}` : 'Design · No SKU yet'}
          </p>
          <DesignStatusBadge status={design.status} />
        </div>
        <h1 className="text-4xl font-medium tracking-[-0.04em] text-balance sm:text-5xl">
          {design.name}
        </h1>
        <SpecChips label="Print settings" specs={printSpecs(design)} />
        {product.length > 0 ? <SpecChips label="Product" specs={product} /> : null}
        <DesignHeaderActions brand={brand} design={design} onChanged={onChanged} />
      </div>
    </header>
  )
}
