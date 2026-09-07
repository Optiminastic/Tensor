'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { deleteInventoryItem } from '@/app/dashboard/[brand]/production/inventory-actions'
import { InventoryItemDialog } from '@/components/production/inventory-item-dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { InventoryItem } from '@/lib/validators/inventory'

interface InventoryItemActionsProps {
  brand: string
  item: InventoryItem
}

/**
 * The per-row menu: edit the item, or take it off the shelf.
 *
 * A Popover rather than a dropdown-menu primitive because the repo has one and
 * not the other, and two actions do not justify a new dependency.
 *
 * Delete asks first, inline in the menu rather than in a second dialog. It is a
 * hard delete - a stock count is not a record of work done, so there is nothing
 * to archive - and an item removed by a mis-click has to be typed back in from
 * memory, including its price.
 */
export function InventoryItemActions({ brand, item }: InventoryItemActionsProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await deleteInventoryItem(brand, item.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove the item.')
      return
    }
    setOpen(false)
    setConfirming(false)
    router.refresh()
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={next => {
          setOpen(next)
          if (!next) {
            setConfirming(false)
            setError(null)
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${item.name}`}
            className="size-8"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          {confirming ? (
            <div className="flex flex-col gap-2 p-2">
              <p className="text-sm">
                Remove <span className="font-medium">{item.name}</span> from the shelf?
              </p>
              {error ? (
                <p role="alert" className="text-danger text-xs">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={() => void remove()} disabled={pending}>
                  {pending ? 'Removing…' : 'Remove'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <button
                type="button"
                className="hover:bg-surface-muted flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                onClick={() => {
                  setOpen(false)
                  setEditing(true)
                }}
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </button>
              <button
                type="button"
                className="text-danger hover:bg-danger-subtle flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Outside the Popover: closing the menu to open the dialog would unmount
          the dialog with it. */}
      <InventoryItemDialog brand={brand} item={item} open={editing} onOpenChange={setEditing} />
    </>
  )
}
