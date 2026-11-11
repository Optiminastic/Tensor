'use client'

import { Columns3, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type JSX } from 'react'

import {
  addInventoryColumn,
  deleteInventoryColumn,
} from '@/app/dashboard/[brand]/production/inventory/inventory-columns-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { InventoryColumn, InventoryShelf } from '@/lib/validators/inventory-columns'

interface InventoryColumnsDialogProps {
  brand: string
  shelf: InventoryShelf
  columns: InventoryColumn[]
}

/**
 * The shelf's own columns: add one, or remove one.
 *
 * Removing a column also removes its value from every row, so the button says
 * so rather than hiding it behind a generic "Delete".
 */
export function InventoryColumnsDialog({
  brand,
  shelf,
  columns,
}: InventoryColumnsDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function add(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setBusy('add')
    const res = await addInventoryColumn(brand, { shelf, name })
    setBusy(null)
    if (!res.ok) {
      setError(res.error ?? 'Could not add the column.')
      return
    }
    setName('')
    router.refresh()
  }

  async function remove(column: InventoryColumn): Promise<void> {
    setError(null)
    setBusy(column.id)
    const res = await deleteInventoryColumn(brand, column.id)
    setBusy(null)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove the column.')
      return
    }
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Columns3 className="size-4" aria-hidden /> Columns
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Custom columns</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <p className="text-muted-foreground text-sm text-pretty">
            Extra columns for this shelf - a size, a supplier, a note. Click a cell in the table to
            fill it in. An import keeps any column it does not recognise here too.
          </p>
          {columns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No custom columns yet.</p>
          ) : (
            <ul className="divide-border border-border divide-y rounded-md border text-sm">
              {columns.map(column => (
                <li key={column.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span>{column.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void remove(column)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {busy === column.id ? 'Removing…' : 'Remove column and its values'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={add} className="flex items-end gap-2">
            <Field label="New column" htmlFor={`new-column-${shelf}`} className="flex-1">
              <Input
                id={`new-column-${shelf}`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Size"
                maxLength={64}
              />
            </Field>
            <Button type="submit" disabled={busy !== null || name.trim() === ''}>
              {busy === 'add' ? 'Adding…' : 'Add column'}
            </Button>
          </form>
          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
