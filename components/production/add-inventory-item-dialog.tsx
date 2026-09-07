'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { addInventoryItem } from '@/app/dashboard/[brand]/production/inventory-actions'
import { Button } from '@/components/ui/button'
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
import { Select } from '@/components/ui/select'
import { INVENTORY_UNITS, type InventoryUnit } from '@/lib/validators/inventory'

interface AddInventoryItemDialogProps {
  brand: string
}

const DEFAULT_UNIT: InventoryUnit = 'piece'

/**
 * Records a non-filament item: a box, an insert, a card, a roll of tape.
 *
 * Quantity and unit are one answer split across two inputs, because "40" means
 * nothing on a shelf that also holds half a kilogram of something. The unit is a
 * fixed list rather than a text box - "pcs", "pieces" and "piece" typed into a
 * free field become three shelves for one item.
 *
 * Price is per ONE unit and may be left blank. Blank is stored as null, not
 * zero: nobody having recorded a price is different from the item being free,
 * and zero would quietly understate the cost of every plank that ships with it.
 */
export function AddInventoryItemDialog({ brand }: AddInventoryItemDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<InventoryUnit>(DEFAULT_UNIT)
  const [price, setPrice] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset(): void {
    setName('')
    setQuantity('')
    setUnit(DEFAULT_UNIT)
    setPrice('')
    setError(null)
  }

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await addInventoryItem(brand, {
      name: name.trim(),
      quantity: Number(quantity || 0),
      unit,
      // Empty stays null rather than becoming 0 - see the note above.
      unit_price: price.trim() === '' ? null : Number(price),
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the item.')
      return
    }
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>Add item</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
          <DialogDescription>
            Anything on the shelf that is not filament. Adding a name that already exists updates
            that item rather than creating a second one.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Item" htmlFor="i-name">
            <Input
              id="i-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Gift box - small"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantity" htmlFor="i-quantity">
              <Input
                id="i-quantity"
                type="number"
                step="0.001"
                min="0"
                data-numeric="true"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Unit" htmlFor="i-unit">
              <Select
                id="i-unit"
                value={unit}
                onChange={e => setUnit(e.target.value as InventoryUnit)}
              >
                {INVENTORY_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Price per unit (₹)" htmlFor="i-price" hint="Optional">
            <Input
              id="i-price"
              type="number"
              step="0.01"
              min="0"
              data-numeric="true"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Leave blank if not recorded"
            />
          </Field>
          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={pending || name.trim() === ''}>
              {pending ? 'Saving…' : 'Save item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
