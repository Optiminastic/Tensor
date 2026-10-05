'use client'

import { Lock, MoreHorizontal, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type MouseEvent } from 'react'

import { approveBatchAction } from '@/app/dashboard/[brand]/production/actions'
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
 * Rebuild, Reprint and Delete are rare next to Done - you press them when
 * something has gone wrong - so putting them all on the row would widen it and
 * give equal weight to the ones you reach for once a week. The everyday
 * decision stays as a button; these fold away.
 *
 * Each is offered only where it means something, and the disabled reason says
 * why rather than leaving a dead item:
 *
 *   - Lock closes a Draft early. Tensor locks a bed on its own once it holds
 *     three units and a printer that can take it is free; this is how a person
 *     says "stop waiting for company, print what is on it". It does NOT send
 *     the bed - locking is the whole act, and the dispatcher picks the machine
 *     and queues it exactly as it does for a bed it locked itself. That is the
 *     point: there is one send path on the floor, not two.
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
  const [pending, setPending] = useState<'lock' | 'rebuild' | 'delete' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingLock, setConfirmingLock] = useState(false)

  const draft = status === 'pending_approval'
  const printed = status === 'completed'
  const printing = status === 'in_progress'

  // The row itself opens the batch; nothing in this menu should.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  /**
   * Locks a Draft, and stops there.
   *
   * No machine_id: its absence is what asks the backend to keep whichever
   * printer the scheduler already picked for the Draft. Passing one here would
   * override a decision made with the whole fleet in view.
   *
   * Two presses, like Delete, because locking reserves the bed's filament and
   * pressing again does not give it back.
   */
  async function lock(): Promise<void> {
    if (!confirmingLock) {
      setConfirmingLock(true)
      return
    }
    setPending('lock')
    setMessage(null)
    setFailed(false)
    const res = await approveBatchAction(brand, batchId, {})
    setPending(null)
    setConfirmingLock(false)
    if (!res.ok || !res.data) {
      setFailed(true)
      setMessage(res.error ?? 'Could not lock this batch.')
      return
    }
    // Said out loud, because the press has no other visible effect for a few
    // seconds: the bed moves to Locked and the dispatcher takes it from there.
    setMessage('Locked. The dispatcher will pick a printer and queue it.')
    router.refresh()
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
          if (!open) {
            setConfirmingDelete(false)
            setConfirmingLock(false)
          }
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
          {/* First, because it is the only item here an operator reaches for as
              part of normal work rather than to fix something. */}
          <DropdownMenuItem
            disabled={!draft}
            // Held open on the first press so the second one lands on the same
            // menu rather than reopening it.
            onSelect={event => {
              if (!confirmingLock) event.preventDefault()
              void lock()
            }}
            title={
              draft
                ? 'Locks this bed now and lets the dispatcher send it'
                : 'This bed is already locked.'
            }
          >
            <Lock className="size-3.5" aria-hidden />
            {pending === 'lock'
              ? 'Locking…'
              : confirmingLock
                ? 'Press again to lock'
                : 'Lock batch'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
