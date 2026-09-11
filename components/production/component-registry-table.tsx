'use client'

import { useMemo, useState, type JSX } from 'react'

import { InventoryItemActions } from '@/components/production/inventory-item-actions'
import { InventoryItemDialog } from '@/components/production/inventory-item-dialog'
import { TablePagination } from '@/components/production/table-pagination'
import { Button } from '@/components/ui/button'
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

interface ComponentRegistryTableProps {
  brand: string
  items: InventoryItem[]
}

const COLUMNS = ['Code', 'Part', 'Unit', 'Price per unit']

/** Figures are mono/tabular so the price column lines up down the page. */
const FIGURE = 'font-mono tabular-nums'

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * The parts a product can be made of: what each one IS, and what one costs.
 *
 * The same rows as Inventory's Others tab, deliberately shown differently. That
 * tab answers "how many have we got" - quantity, total value, when it was last
 * counted. This one answers "what is this part and what does one cost", which is
 * what a bill of materials multiplies. Two questions, two column sets, one
 * shelf: duplicating the rows into a second table would mean two stock counts
 * for one box of switches, and one of them would always be wrong.
 *
 * The code is what a BOM points at, and why it leads the table. A BOM keyed on
 * the NAME would break the day somebody renames "LED strip" to "LED strip (10cm,
 * warm white)" - which is exactly the kind of tidying nobody thinks twice about.
 * Parts without a code are still listed, because they are still on the shelf;
 * they simply cannot be referenced until they have one.
 */
export function ComponentRegistryTable({ brand, items }: ComponentRegistryTableProps): JSX.Element {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return items
    return items.filter(
      item =>
        item.name.toLowerCase().includes(needle) ||
        (item.code ?? '').toLowerCase().includes(needle),
    )
  }, [items, search])

  const page = usePagination(filtered)

  // Counted rather than hidden: a part with no code is the one thing on this
  // page that stops a bill of materials being written, so the number belongs
  // where somebody will see it.
  const withoutCode = useMemo(() => items.filter(item => !item.code).length, [items])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search parts"
          aria-label="Search parts"
          className="max-w-64"
        />
        <div className="flex items-center gap-3">
          {withoutCode > 0 ? (
            <span className="text-muted-foreground text-xs">{withoutCode} without a code</span>
          ) : null}
          <InventoryItemDialog brand={brand} trigger={<Button>Add part</Button>} />
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-muted-foreground px-5 py-4 text-sm">
            No parts yet. Add the things a product is built from — base box, LED strip, battery,
            switch, wire — and what one of each costs.
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
                <TableHeaderCell className="w-12 py-2">
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length + 1}
                    className="text-muted-foreground text-center text-sm"
                  >
                    No parts match that search.
                  </TableCell>
                </TableRow>
              ) : (
                page.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className={`py-2 ${FIGURE}`}>
                      {item.code ? (
                        item.code
                      ) : (
                        <span className="text-muted-foreground font-sans">not set</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground py-2">{item.unit}</TableCell>
                    {/* An em dash, not ₹0: nobody having recorded a price is
                        different from the part being free, and a BOM that
                        totalled unknown prices as zero would understate every
                        product that carries one. */}
                    <TableCell className={`py-2 ${FIGURE}`}>
                      {item.unit_price === null ? (
                        <span className="text-muted-foreground font-sans">—</span>
                      ) : (
                        money(item.unit_price)
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <InventoryItemActions brand={brand} item={item} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination page={page} noun="parts" />
        </Card>
      )}
    </div>
  )
}
