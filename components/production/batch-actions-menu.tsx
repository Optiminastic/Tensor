'use client'

import { MoreHorizontal, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type MouseEvent } from 'react'

import {
  deleteBatchAction,
  rebuildBatch,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import type { BatchStatus } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * The actions a bed can take, behind one control on its row.
 *
 * Rebuild, Reprint and Delete are rare next to Queue and Done - you press them
 * when something has gone wrong - so putting all five on the row would widen it
 * and give equal weight to the ones you reach for once a week. The two everyday
 * decisions stay as buttons; these three fold away.
 *
 * Each is offered only where it means something, and the disabled reason says
 * why rather than leaving a dead item:
 *
 *   - Rebuild checks every model against its order. It is worth pressing on any
 *     bed, including a printed one, because a completed bed's models are what a
 *     reprint is built from.
 *   - Reprint is for a bed that has printed. There is nothing to replace before
 *     that.
 *   - Delete refuses a bed that is printing (a machine is working on it) and one
 *     that has printed (that bed is the record of what was made).
 */
interface BatchActionsMenuProps {
  brand: string
  batchId: string
  batchNumber: string
  status: BatchStatus
  /** Opens the reprint dialog, which the row owns - a dialog cannot live inside
   *  a menu that unmounts when an item is chosen. */
  onReprint?: () => void
}

export function BatchActionsMenu({
  brand,
  batchId,
  batchNumber,
  status,
  onReprint,
}: BatchActionsMenuProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState<'rebuild' | 'delete' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const printed = status === 'completed'
  const printing = status === 'in_progress'

  // The row itself opens the batch; nothing in this menu should.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  async function rebuild(): Promise<void> {
    setPending('rebuild')
    setMessage(null)
    setFailed(false)
    const res = await rebuildBatch(brand, batchId)
    setPending(null)
    if (!res.ok || !res.data) {
      setFailed(true)
      setMessage(res.error ?? "Could not check this batch's models.")
      return
    }
    setMessage(res.data.note)
    router.refresh()
  }

  async function remove(): Promise<void> {
    // Two presses, not a browser confirm(): deleting a bed withdraws its plate
    // and releases its filament, and a dialog that blocks the page is a worse
    // way to ask than a button that says what it is about to do.
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    setPending('delete')
    setMessage(null)
    setFailed(false)
    const res = await deleteBatchAction(brand, batchId)
    setPending(null)
    setConfirmingDelete(false)
    if (!res.ok || !res.data) {
      setFailed(true)
      setMessage(res.error ?? 'Could not delete this batch.')
      return
    }
    router.refresh()
  }

  return (
    <div onClick={stopRowClick} className="flex flex-col items-end gap-1">
      <DropdownMenu
        onOpenChange={open => {
          if (!open) setConfirmingDelete(false)
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Actions for ${batchNumber}`}
            disabled={pending !== null}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => void rebuild()}>
            <RefreshCw className="size-3.5" aria-hidden />
            {pending === 'rebuild' ? 'Checking…' : 'Rebuild batch'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!printed || !onReprint}
            onSelect={() => onReprint?.()}
            title={printed ? undefined : 'Only a batch that has printed can be reprinted.'}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reprint planks
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={printed || printing}
            // Kept open on the first press so the second one lands on the same
            // menu rather than reopening it.
            onSelect={event => {
              if (!confirmingDelete) event.preventDefault()
              void remove()
            }}
            className="text-danger"
            title={
              printing
                ? 'This batch is printing on a machine right now.'
                : printed
                  ? 'This batch has printed; its record is kept.'
                  : undefined
            }
          >
            <Trash2 className="size-3.5" aria-hidden />
            {pending === 'delete'
              ? 'Deleting…'
              : confirmingDelete
                ? 'Press again to delete'
                : 'Delete batch'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {message ? (
        <p
          role={failed ? 'alert' : undefined}
          className={`max-w-56 text-right text-xs ${failed ? 'text-danger' : 'text-muted-foreground'}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
