'use client'

import { FileCog, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { removeVariant } from '@/app/dashboard/[brand]/production/registry-actions'
import { VariantDesignDialog } from '@/components/production/variant-design-dialog'
import { VariantFormDialog } from '@/components/production/variant-form-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { ProductOption, RegistryVariant } from '@/lib/validators/registry'

interface VariantTableProps {
  brand: string
  productCode: string
  options: ProductOption[]
  variants: RegistryVariant[]
}

const FIGURE = 'font-mono tabular-nums'
const COLUMNS = ['Variant', 'SKU', 'Prints from', 'Parts', 'Parts cost', '']

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Every combination the options make, with what each one resolves to.
 *
 * A table rather than a list of expanders: these rows exist to be COMPARED -
 * which variants carry parts, which have a SKU, which print from the same file -
 * and a comparison you have to open six times is not one.
 */
export function VariantTable({
  brand,
  productCode,
  options,
  variants,
}: VariantTableProps): JSX.Element {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function drop(variant: RegistryVariant): Promise<void> {
    setError(null)
    const res = await removeVariant(brand, variant.id)
    if (!res.ok) {
      setError(res.error ?? 'Could not delete the variant.')
      return
    }
    router.refresh()
  }

  const addButton = (
    <VariantFormDialog
      brand={brand}
      productCode={productCode}
      options={options}
      trigger={
        <Button variant="secondary" size="sm">
          <Plus className="size-3.5" aria-hidden />
          Add variant
        </Button>
      }
    />
  )

  if (variants.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 py-3">
        <p className="text-muted-foreground text-sm">
          No variants yet. A variant is one combination of this product&rsquo;s options.
        </p>
        {addButton}
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="overflow-x-auto">
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
                <TableCell className="py-2">
                  <span className="font-medium">{variant.name}</span>
                  {variant.options ? (
                    <span className="text-subtle-foreground mt-0.5 block font-mono text-xs">
                      {variant.options}
                    </span>
                  ) : null}
                </TableCell>
                {/* "not set" rather than blank: a variant with no SKU is a real
                    and common state - nine live plank lines carry none - not a
                    value somebody forgot. */}
                <TableCell className={`py-2 ${FIGURE}`}>
                  {variant.sku ?? <span className="text-muted-foreground font-sans">not set</span>}
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
                  <div className="flex items-center justify-end gap-0.5">
                    <VariantDesignDialog
                      brand={brand}
                      variant={variant}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Link a design to ${variant.name}`}
                        >
                          <FileCog className="size-3.5" aria-hidden />
                        </Button>
                      }
                    />
                    <VariantFormDialog
                      brand={brand}
                      productCode={productCode}
                      options={options}
                      variant={variant}
                      trigger={
                        <Button variant="ghost" size="sm" aria-label={`Edit ${variant.name}`}>
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${variant.name}`}
                      onClick={() => void drop(variant)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
      <div>{addButton}</div>
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
