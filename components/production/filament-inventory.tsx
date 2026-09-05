'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, type JSX } from 'react'

import { addFilament } from '@/app/dashboard/[brand]/production/actions'
import {
  ALL_TIME_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { FilamentSyncButton } from '@/components/production/filament-sync-button'
import { FilterBar } from '@/components/production/filter-bar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { TabItem } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Filament } from '@/lib/validators/production'

interface FilamentInventoryProps {
  brand: string
  filaments: Filament[]
}

interface ColourSwatchProps {
  name: string | null | undefined
  hex: string | null | undefined
}

/**
 * The colour, shown rather than described.
 *
 * A name is what the planner keys on, but nobody can picture "Ivory" - and an
 * operator matching stock against a shelf is matching the swatch. The dot is
 * only drawn when a hex actually exists: a row typed in by hand has no colour
 * to show, and defaulting to grey would look like a real colour rather than an
 * absent one.
 */
function ColourSwatch({ name, hex }: ColourSwatchProps): JSX.Element {
  if (!name) return <span className="text-muted-foreground">-</span>
  return (
    <span className="flex items-center gap-2">
      {hex ? (
        <span
          aria-hidden
          className="border-border size-3.5 shrink-0 rounded-full border"
          style={{ backgroundColor: hex }}
        />
      ) : null}
      <span>{name}</span>
    </span>
  )
}

function isLow(filament: Filament): boolean {
  return filament.grams_available < filament.reorder_level_grams
}

function matchesSearch(filament: Filament, search: string): boolean {
  if (!search) return true
  const haystack = `${filament.material} ${filament.colour ?? ''}`.trim().toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

/** Filament stock, one line per (material, colour), with a reorder threshold and a
 * low-stock indicator. Wired to Tensor-Core's /filament-inventory. */
export function FilamentInventory({ brand, filaments }: FilamentInventoryProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [stock, setStock] = useState('')
  const [material, setMaterial] = useState('')
  // All time by default - see the same note on OrdersTable. Filters on
  // updated_at, not created_at: a spool row is created once and then moves
  // with every reservation and restock, so "what changed in this window" is
  // the question worth asking of stock. created_at would only ever answer
  // "when was this line first added", which for a stable catalogue is nearly
  // always the same distant day for every row.
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const materialOptions = useMemo(
    () =>
      Array.from(new Set(filaments.map(f => f.material)))
        .sort((a, b) => a.localeCompare(b))
        .map(m => ({ value: m, label: m })),
    [filaments],
  )

  const tabs: TabItem[] = useMemo(
    () => [
      { value: '', label: 'All', count: filaments.length },
      { value: 'in_stock', label: 'In stock', count: filaments.filter(f => !isLow(f)).length },
      { value: 'low', label: 'Low', count: filaments.filter(isLow).length },
    ],
    [filaments],
  )

  const filtered = useMemo(
    () =>
      filaments.filter(
        filament =>
          matchesSearch(filament, search) &&
          (!stock || (stock === 'low' ? isLow(filament) : !isLow(filament))) &&
          (!material || filament.material === material) &&
          isWithinDateRange(filament.updated_at, periodRange),
      ),
    [filaments, search, stock, material, periodRange],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-3xl">Filament Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Stock per material and colour, with a reorder threshold.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <FilamentSyncButton brand={brand} />
          <AddFilamentDialog brand={brand} />
        </div>
      </div>

      {filaments.length === 0 ? (
        <Card>
          <p className="text-muted-foreground px-5 py-4 text-sm">
            No filament recorded yet. Sync from BambuBuddy to pull in the spool shelf, or add a line
            by hand.
          </p>
        </Card>
      ) : (
        <>
          <FilterBar
            tabs={tabs}
            tabValue={stock}
            onTabChange={setStock}
            tabsLabel="Filter filament by stock level"
            filters={[
              {
                label: 'Material',
                value: material,
                onChange: setMaterial,
                options: materialOptions,
              },
            ]}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search material, colour"
            period={period}
            onPeriodChange={setPeriod}
          />
          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Material</TableHeaderCell>
                  <TableHeaderCell>Colour</TableHeaderCell>
                  <TableHeaderCell className="text-right">Available (kg)</TableHeaderCell>
                  <TableHeaderCell className="text-right">Reorder at (kg)</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center text-sm">
                      No filament matches these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(filament => {
                    const low = isLow(filament)
                    return (
                      <TableRow key={filament.id}>
                        <TableCell className="font-medium">{filament.material}</TableCell>
                        <TableCell>
                          <ColourSwatch name={filament.colour} hex={filament.colour_hex} />
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {(filament.grams_available / 1000).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {(filament.reorder_level_grams / 1000).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              low
                                ? 'bg-warning-subtle text-warning'
                                : 'bg-success-subtle text-success',
                            )}
                          >
                            {low ? 'Low' : 'In stock'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

function AddFilamentDialog({ brand }: { brand: string }): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [material, setMaterial] = useState('')
  const [colour, setColour] = useState('')
  const [kg, setKg] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await addFilament(brand, {
      material: material.trim(),
      colour: colour.trim() || undefined,
      grams_available: kg * 1000,
      reorder_level_grams: 0,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the filament.')
      return
    }
    setOpen(false)
    setMaterial('')
    setColour('')
    setKg(0)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add filament</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add filament</DialogTitle>
          <DialogDescription>
            Stock is tracked per material and colour; adding an existing pair updates it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Material" htmlFor="f-material">
              <Input
                id="f-material"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                placeholder="e.g. PLA Basic"
              />
            </Field>
            <Field label="Colour" htmlFor="f-colour" hint="Optional">
              <Input
                id="f-colour"
                value={colour}
                onChange={e => setColour(e.target.value)}
                placeholder="e.g. Matte black"
              />
            </Field>
            <Field label="Quantity (kg)" htmlFor="f-quantity">
              <Input
                id="f-quantity"
                type="number"
                step="0.01"
                min="0"
                data-numeric="true"
                value={kg}
                onChange={e => setKg(Number(e.target.value))}
              />
            </Field>
          </div>
          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <Button
            className="self-start"
            disabled={pending || material.trim().length === 0}
            onClick={() => void save()}
          >
            {pending ? 'Saving…' : 'Add filament'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
