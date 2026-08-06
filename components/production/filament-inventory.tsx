'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { addFilament } from '@/app/dashboard/[brand]/production/actions'
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
import { cn } from '@/lib/utils'
import type { Filament } from '@/lib/validators/production'

interface FilamentInventoryProps {
  brand: string
  filaments: Filament[]
}

/** Filament stock, one line per (material, colour), with a reorder threshold and a
 * low-stock indicator. Wired to Tensor-Core's /filament-inventory. */
export function FilamentInventory({ brand, filaments }: FilamentInventoryProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-3xl">Filament Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Stock per material and colour, with a reorder threshold.
          </p>
        </div>
        <AddFilamentDialog brand={brand} />
      </div>

      {filaments.length === 0 ? (
        <Card>
          <p className="text-muted-foreground px-5 py-4 text-sm">
            No filament recorded yet. Add a line to start tracking stock.
          </p>
        </Card>
      ) : (
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
              {filaments.map(filament => {
                const low = filament.grams_available < filament.reorder_level_grams
                return (
                  <TableRow key={filament.id}>
                    <TableCell className="font-medium">{filament.material}</TableCell>
                    <TableCell>{filament.colour ?? '-'}</TableCell>
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
                          low ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success',
                        )}
                      >
                        {low ? 'Low' : 'In stock'}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
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
