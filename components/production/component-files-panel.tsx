'use client'

import { useEffect, useState, type JSX } from 'react'

import { loadComponentPlates } from '@/app/dashboard/[brand]/production/component-actions'
import { ComponentPlateGrid } from '@/components/production/component-plate-grid'
import { Tag } from '@/components/ui/tag'
import type { ComponentPlate, InventoryItem, PlateScope } from '@/lib/validators/inventory'
import type { RegistryVariant } from '@/lib/validators/registry'
import type { ShopifyVariant } from '@/lib/validators/shopify-products'

interface ComponentFilesPanelProps {
  brand: string
  /** The parts on this product's bill of materials, already resolved. */
  parts: InventoryItem[]
  /** This product's SKUs, which are the rows of a per-SKU grid. */
  variants: RegistryVariant[]
  disabled: boolean
}

/**
 * The files for the parts a product is made of, on the product.
 *
 * THEY ARE STORED AND NEVER OPENED. Nothing in Tensor reads them - the routes
 * are upload, list and delete, and no dispatch path touches the table. The
 * shop keeps the finished plate for a part so that printing more of them is
 * sending a saved file rather than arranging and slicing a bed again, and
 * keeps the mesh it came from beside it.
 *
 * HERE RATHER THAN ONLY ON THE COMPONENTS TAB, which is where these uploads
 * lived and where nobody configuring a product was. A product's three kinds of
 * file - the one that prints, the one the customer is shown, and the ones its
 * parts are made from - now sit on the one card, so "is this product set up"
 * is a question answered by looking in one place.
 *
 * Only PRINTED parts appear. A bought-in gift box has nothing to upload.
 */
export function ComponentFilesPanel({
  brand,
  parts,
  variants,
  disabled,
}: ComponentFilesPanelProps): JSX.Element {
  const printed = parts.filter(p => p.source === 'printed')

  if (printed.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing to upload yet. Files belong to a part, so add the part above first — a printed one:
        a bought-in box has no file.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">
        A sliced <code className="font-mono text-xs">.gcode</code>, the{' '}
        <code className="font-mono text-xs">.3mf</code> it came from, or the{' '}
        <code className="font-mono text-xs">.stl</code> it was modelled as. Tensor stores these and
        never opens them — they are here so the file for a part is kept with the product rather than
        on somebody&rsquo;s desktop.
      </p>
      {printed.map(part => (
        <ComponentFiles
          key={part.id}
          brand={brand}
          part={part}
          variants={variants}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

interface ComponentFilesProps {
  brand: string
  part: InventoryItem
  variants: RegistryVariant[]
  disabled: boolean
}

/** One part, and the grid of files held for it. */
function ComponentFiles({ brand, part, variants, disabled }: ComponentFilesProps): JSX.Element {
  const [plates, setPlates] = useState<ComponentPlate[] | null>(null)

  useEffect(() => {
    let live = true
    void loadComponentPlates(part.id).then(res => {
      if (live) setPlates(res.ok && res.data ? res.data : [])
    })
    return () => {
      live = false
    }
  }, [part.id])

  // 'per_sku' is the stored default, and it is the right one to assume: a file
  // with the filament baked in is not valid for another colourway. A part that
  // genuinely is the same on every SKU says so on the Components tab, and that
  // collapses the grid to one row.
  const scope: PlateScope = (part.plate_scope as PlateScope) ?? 'per_sku'

  // The grid addresses rows by SKU, so a variant without one has nothing to
  // hang a file on. Retired SKUs stay: a retired colourway still has jobs
  // against it, and its file is what a re-print of one of those would use.
  const rows: ShopifyVariant[] = variants
    .filter(v => (v.sku ?? '').trim() !== '')
    .map(v => ({ id: v.id, sku: (v.sku ?? '').trim(), title: v.name }))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{part.name}</span>
        {part.code ? (
          <span className="text-subtle-foreground font-mono text-xs">{part.code}</span>
        ) : null}
        <Tag tone={scope === 'shared' ? 'muted' : 'accent'}>
          {scope === 'shared' ? 'One file for every SKU' : 'A file per SKU'}
        </Tag>
      </div>

      {plates === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : scope === 'per_sku' && rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          None of this product&rsquo;s SKUs carries a code, so there is nothing to address a file
          to. Add SKUs in Shopify, then re-import the product.
        </p>
      ) : (
        <ComponentPlateGrid
          brand={brand}
          itemId={part.id}
          variants={rows}
          plates={plates}
          scope={scope}
          disabled={disabled}
          onChanged={setPlates}
        />
      )}
    </div>
  )
}
