'use client'

import { useMemo, useState, type JSX } from 'react'

import { AddInventoryItemDialog } from '@/components/production/add-inventory-item-dialog'
import { TablePagination } from '@/components/production/table-pagination'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import type { InventoryItem } from '@/lib/validators/inventory'

interface InventoryItemsTableProps {
  brand: string
  items: InventoryItem[]
}

const COLUMNS = ['Item', 'Quantity', 'Price per unit', 'Total value', 'Updated']

/** Figures are mono/tabular so the quantity and money columns line up down the
 *  page - the whole reason to read this table is to compare them. */
const FIGURE = 'font-mono tabular-nums'

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Quantity without trailing zeros: "40", not "40.000", but "0.5" survives. */
function quantity(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 3 })
}

/**
 * The non-filament shelf.
 *
 * Deliberately plainer than the Filament tab beside it: no stock tabs, no
 * material filter, no reorder threshold. Those exist for filament because the
 * planner reserves it and a print fails without it. Nothing consumes these items
 * automatically, so the only question this table answers is "what have we got,
 * and what is it worth" - and inventing a low-stock rule would mean inventing
 * the reorder level it compares against.
 */
export function InventoryItemsTable({ brand, items }: InventoryItemsTableProps): JSX.Element {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return items
    return items.filter(item => item.name.toLowerCase().includes(needle))
  }, [items, search])

  const page = usePagination(filtered)

  const totalValue = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.unit_price === null ? 0 : item.unit_price * item.quantity),
        0,
      ),
    [items],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items"
          aria-label="Search inventory items"
          className="max-w-64"
        />
        <div className="flex items-center gap-3">
          {items.length > 0 ? (
            <span className="text-muted-foreground text-xs">
              Total value <span className={FIGURE}>{money(totalValue)}</span>
            </span>
          ) : null}
          <AddInventoryItemDialog brand={brand} />
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-muted-foreground px-5 py-4 text-sm">
            Nothing on this shelf yet. Add the boxes, inserts and cards a plank ships with.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                {COLUMNS.map(column => (
                  <TableHeaderCell key={column} className="py-2 whitespace-nowrap">
                    {column}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length}
                    className="text-muted-foreground text-center text-sm"
                  >
                    No items match that search.
                  </TableCell>
                </TableRow>
              ) : (
                page.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2 font-medium">{item.name}</TableCell>
                    <TableCell className={`py-2 ${FIGURE}`}>
                      {quantity(item.quantity)}{' '}
                      <span className="text-muted-foreground font-sans">{item.unit}</span>
                    </TableCell>
                    {/* An em dash, not ₹0: nobody having recorded a price is
                        different from the item being free. */}
                    <TableCell className={`py-2 ${FIGURE}`}>
                      {item.unit_price === null ? (
                        <span className="text-muted-foreground font-sans">—</span>
                      ) : (
                        money(item.unit_price)
                      )}
                    </TableCell>
                    <TableCell className={`py-2 ${FIGURE}`}>
                      {item.unit_price === null ? (
                        <span className="text-muted-foreground font-sans">—</span>
                      ) : (
                        money(item.unit_price * item.quantity)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-2 text-xs whitespace-nowrap">
                      {new Date(item.updated_at).toLocaleDateString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination page={page} noun="items" />
        </Card>
      )}
    </div>
  )
}
