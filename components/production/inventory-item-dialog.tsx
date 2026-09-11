'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

import {
  addInventoryItem,
  editInventoryItem,
} from '@/app/dashboard/[brand]/production/inventory-actions'
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
import { INVENTORY_UNITS, type InventoryItem, type InventoryUnit } from '@/lib/validators/inventory'

interface InventoryItemDialogProps {
  brand: string
  /** The item being edited. Omitted to add a new one. */
  item?: InventoryItem
  /** Rendered as the trigger. Omitted when the caller drives `open` itself. */
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DEFAULT_UNIT: InventoryUnit = 'piece'

/**
 * Records a non-filament item, or edits one already on the shelf.
 *
 * One dialog for both because the questions are identical - the only difference
 * is whether the answers start blank. Two dialogs would have meant two copies
 * of the unit list and the price rule, which is exactly the pair that must not
 * drift.
 *
 * Quantity and unit are one answer split across two inputs, because "40" means
 * nothing on a shelf that also holds half a kilogram of something. The unit is a
 * fixed list rather than a text box - "pcs", "pieces" and "piece" typed into a
 * free field become three shelves for one item.
 *
 * Price is per ONE unit and may be left blank. Blank is stored as null, not
 * zero: nobody having recorded a price is different from the item being free,
 * and zero would quietly understate the cost of every plank that carries it.
 */
export function InventoryItemDialog({
  brand,
  item,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: InventoryItemDialogProps): JSX.Element {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [name, setName] = useState(item?.name ?? '')
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '')
  const [unit, setUnit] = useState<InventoryUnit>((item?.unit as InventoryUnit) ?? DEFAULT_UNIT)
  const [price, setPrice] = useState(
    item?.unit_price === null ? '' : String(item?.unit_price ?? ''),
  )
  const [code, setCode] = useState(item?.code ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-seed when the dialog reopens: the row behind it may have changed since
  // this component mounted, and an edit form showing stale figures would write
  // them straight back.
  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setQuantity(item ? String(item.quantity) : '')
    setUnit((item?.unit as InventoryUnit) ?? DEFAULT_UNIT)
    setPrice(
      item?.unit_price === null || item?.unit_price === undefined ? '' : String(item.unit_price),
    )
    setCode(item?.code ?? '')
    setError(null)
  }, [open, item])

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const payload = {
      name: name.trim(),
      quantity: Number(quantity || 0),
      unit,
      // Empty stays null rather than becoming 0 - see the note above.
      unit_price: price.trim() === '' ? null : Number(price),
      // Undefined, not null, when blank: the backend COALESCEs an absent code so
      // an edit that does not touch the field leaves the handle alone. Sending
      // null would clear it, and every bill of materials pointing at it with it.
      code: code.trim() === '' ? undefined : code.trim().toUpperCase(),
    }
    const res = item
      ? await editInventoryItem(brand, item.id, payload)
      : await addInventoryItem(brand, payload)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the item.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit item' : 'Add item'}</DialogTitle>
          <DialogDescription>
            {item
              ? 'Change what is on the shelf, or what one costs.'
              : 'Anything on the shelf that is not filament. Adding a name that already exists updates that item rather than creating a second one.'}
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
          {/* Optional, and last of the identifying fields: a part only needs a
              code once something references it. Upper-cased on save so
              "led-001" and "LED-001" cannot become two parts. */}
          <Field label="Part code (optional)" htmlFor="i-code">
            <Input
              id="i-code"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. LED-10CM"
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
              {pending ? 'Saving…' : item ? 'Save changes' : 'Save item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
