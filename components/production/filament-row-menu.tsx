'use client'

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { removeFilament } from '@/app/dashboard/[brand]/production/inventory/filament-row-actions'
import { FilamentRowDialog } from '@/components/production/filament-row-dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Filament } from '@/lib/validators/production'

interface FilamentRowMenuProps {
  brand: string
  filament: Filament
}

const ITEM = 'hover:bg-surface-muted flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm'

/**
 * The per-row menu on the Filament tab: edit the row, add a new one, or take
 * it off the shelf. Shaped like the Others tab's menu beside it.
 *
 * Delete asks first, inline: it is a hard delete, and a stock line removed by
 * a mis-click has to be typed back in from memory.
 */
export function FilamentRowMenu({ brand, filament }: FilamentRowMenuProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<'edit' | 'add' | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label = [filament.material, filament.colour].filter(Boolean).join(' ')

  async function remove(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await removeFilament(brand, filament.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove the filament.')
      return
    }
    setOpen(false)
    setConfirming(false)
    router.refresh()
  }

  function openDialog(which: 'edit' | 'add'): void {
    setOpen(false)
    setDialog(which)
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
            aria-label={`Actions for ${label}`}
            className="size-8"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-1">
          {confirming ? (
            <div className="flex flex-col gap-2 p-2">
              <p className="text-sm">
                Remove <span className="font-medium">{label}</span> from the shelf?
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
              <button type="button" className={ITEM} onClick={() => openDialog('edit')}>
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </button>
              <button type="button" className={ITEM} onClick={() => openDialog('add')}>
                <Plus className="size-3.5" aria-hidden />
                Add new filament
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

      {/* Outside the Popover: closing the menu would unmount the dialog with it. */}
      <FilamentRowDialog
        brand={brand}
        filament={dialog === 'edit' ? filament : undefined}
        open={dialog !== null}
        onOpenChange={next => {
          if (!next) setDialog(null)
        }}
      />
    </>
  )
}
