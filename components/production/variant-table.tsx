'use client'

import { FileCog } from 'lucide-react'
import type { JSX } from 'react'

import { VariantDesignDialog } from '@/components/production/variant-design-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { RegistryVariant } from '@/lib/validators/registry'

interface VariantTableProps {
  brand: string
  variants: RegistryVariant[]
}

const FIGURE = 'font-mono tabular-nums'
const COLUMNS = ['SKU', 'Variant', 'Prints from', 'Parts', 'Parts cost', '']

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * The SKUs this product covers, and what each one resolves to.
 *
 * Read-only, and that is the change that matters. These rows used to be typed
 * in by hand, which produced a second answer to a question Shopify had already
 * answered - DNP carried six variants named "2 hearts, With light" with no
 * SKUs at all, matching no order that has ever arrived. They now come from the
 * import, and the way to change one is to change it in Shopify and import
 * again.
 *
 * What is left is the most useful thing on the page: the list somebody reads
 * to check that the right orders will match, and that every one of them has a
 * file to print from.
 *
 * SKU leads the row rather than the name, because the SKU is what an order
 * carries and the name is only how a person recognises it.
 */
export function VariantTable({ brand, variants }: VariantTableProps): JSX.Element {
  if (variants.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 py-3">
        <p className="text-muted-foreground text-sm">
          No SKUs. Import this product from Shopify to bring them in — until then no order can be
          matched to it.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map((column, i) => (
              <TableHeaderCell key={column || `actions-${i}`} className="py-2 whitespace-nowrap">
                {column || <span className="sr-only">Actions</span>}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {variants.map(variant => (
            <TableRow key={variant.id}>
              {/* "no SKU" is a fault, not a blank: it is a variant no order can
                  ever be matched to, and the fix is in Shopify. */}
              <TableCell className={`py-2 ${FIGURE}`}>
                {variant.sku ?? <span className="text-warning font-sans text-xs">no SKU</span>}
              </TableCell>
              <TableCell className="py-2">
                <span className="text-muted-foreground text-sm">{variant.name}</span>
                {variant.status === 'active' ? null : (
                  <span className="text-subtle-foreground mt-0.5 block text-xs">
                    {variant.status}
                  </span>
                )}
              </TableCell>
              <TableCell className={`py-2 ${FIGURE}`}>
                {variant.design?.template_key ?? (
                  <span className="text-muted-foreground font-sans">no design</span>
                )}
              </TableCell>
              <TableCell className="py-2">
                {variant.part_count > 0 ? (
                  <PartsSummary variant={variant} />
                ) : (
                  <span className="text-muted-foreground text-sm">none</span>
                )}
              </TableCell>
              {/* An em dash would read as "free"; this says which it is. */}
              <TableCell className={`py-2 ${FIGURE}`}>
                {variant.parts_cost === null || variant.parts_cost === undefined ? (
                  <span
                    className="text-muted-foreground font-sans text-xs"
                    title="One or more parts has no recorded price"
                  >
                    {variant.part_count > 0 ? 'not priced' : '—'}
                  </span>
                ) : (
                  money(variant.parts_cost)
                )}
              </TableCell>
              <TableCell className="py-2">
                {/* The one per-variant affordance left. A template prints every
                    colour and is set for the whole product above; an uploaded
                    3MF is one specific model and can only belong to one SKU. */}
                <div className="flex items-center justify-end">
                  <VariantDesignDialog
                    brand={brand}
                    variant={variant}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Link a design to ${variant.sku ?? variant.name}`}
                      >
                        <FileCog className="size-3.5" aria-hidden />
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** The parts themselves, named rather than counted - "4 parts" tells nobody
 *  whether the switch is on the list. */
function PartsSummary({ variant }: { variant: RegistryVariant }): JSX.Element {
  const parts = variant.parts ?? []
  if (parts.length === 0) {
    return <span className="text-muted-foreground text-sm">{variant.part_count}</span>
  }
  return (
    <span className="flex flex-col gap-0.5 text-xs">
      {parts.map(part => (
        <span key={part.item_id} className="text-muted-foreground whitespace-nowrap">
          <span className={FIGURE}>{part.quantity}</span> × {part.item_name}
        </span>
      ))}
    </span>
  )
}
