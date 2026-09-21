'use client'

import { Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type MouseEvent } from 'react'

import {
  loadBatchQueueOptions,
  queueBatchToMachineAction,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { SlotTrayPicker } from '@/components/production/slot-tray-picker'
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
import { Select } from '@/components/ui/select'
import type { BatchQueueOptions, BatchStatus, QueueTray } from '@/lib/validators/batches'

/**
 * Where a spool is, as the machine itself labels it.
 *
 * The label is the backend's, because only that side sees every unit on the
 * printer: an AMS reports an id of its own choosing - the A2L's AMS Lite says
 * 6 - so adding one to the raw id named a unit the machine does not have. With
 * no label recorded the colour stands in rather than a guessed location.
 */
function slotLabel(tray: QueueTray): string {
  return tray.label || tray.hex
}

interface BatchQueueDialogProps {
  brand: string
  batchId: string
  batchNumber: string
  status: BatchStatus
  /** True once the bed is in BambuBuddy's queue - it must not be sent twice. */
  alreadyQueued: boolean
  /** Tighter rendering for a dense table row. */
  compact?: boolean
}

/**
 * Choosing which printer runs a bed.
 *
 * Tensor used to decide this by itself and send the plate off - which was only
 * as good as its picture of the fleet, and left the person who can SEE which
 * spools are loaded with no say. So the choice comes back to them: the dialog
 * shows the colours this bed needs, and the printers that hold every one of
 * them.
 *
 * Machines that cannot take it are listed too, greyed, saying what they are
 * missing. A printer standing idle and simply absent from the list is the kind
 * of thing that gets worked around rather than fixed.
 *
 * The options are fetched when the dialog opens, never with the page: a queue
 * tab can hold dozens of beds, and thirteen printers' worth of AMS state per row
 * is work nobody asked for.
 */
export function BatchQueueDialog({
  brand,
  batchId,
  batchNumber,
  status,
  alreadyQueued,
  compact = false,
}: BatchQueueDialogProps): JSX.Element | null {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<BatchQueueOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [machineId, setMachineId] = useState('')
  // The spool chosen for each plate slot, in slot order. Seeded from the
  // machine's suggestion and overridden by the operator.
  const [slotTrays, setSlotTrays] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void loadBatchQueueOptions(batchId).then(res => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not read which printers can take this batch.')
        return
      }
      setOptions(res.data)
      // Preselect the printer that already holds the closest match to this
      // bed's colours, so the common case is one press. Falls back to the first
      // eligible machine when the backend could not suggest one.
      const machine =
        res.data.machines.find(m => m.suggested) ?? res.data.machines.find(m => m.eligible)
      setMachineId(machine?.id ?? '')
      setSlotTrays(machine?.suggested_slot_trays ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [open, batchId])

  // The row itself opens the batch; nothing in here should.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  // Changing printer changes which spools exist, so the previous picks are
  // meaningless - re-seed from the new machine's own suggestion rather than
  // carrying indices that point at another printer's trays.
  function chooseMachine(id: string): void {
    setMachineId(id)
    const machine = options?.machines.find(m => m.id === id)
    setSlotTrays(machine?.suggested_slot_trays ?? [])
  }

  async function submit(): Promise<void> {
    if (!machineId) {
      setError('Pick a printer to send this batch to.')
      return
    }
    const slots = options?.slots ?? []
    if (slotTrays.length !== slots.length || slotTrays.some(i => !Number.isFinite(i) || i < 0)) {
      setError('Choose a spool for every slot on this bed.')
      return
    }
    setPending(true)
    setError(null)
    const res = await queueBatchToMachineAction(brand, batchId, {
      machine_id: machineId,
      slot_trays: slotTrays,
    })
    setPending(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not send this batch to that printer.')
      return
    }
    if (!res.data.queued) {
      setError(res.data.note)
      return
    }
    setOpen(false)
    router.refresh()
  }

  const eligible = options?.machines.filter(m => m.eligible) ?? []
  const selected = options?.machines.find(m => m.id === machineId) ?? null
  const isDraft = status === 'pending_approval'

  // Nothing to queue on a printed bed, and nothing to queue twice. Rendering a
  // disabled control for a bed that is already printing says more than hiding
  // it: the row still shows why there is no button.
  if (status === 'completed') return null
  if (alreadyQueued || status === 'in_progress') {
    return (
      <div onClick={stopRowClick}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
          title={alreadyQueued ? "Already in BambuBuddy's queue" : 'This bed is printing'}
        >
          <Printer className="size-3.5" aria-hidden />
          {status === 'in_progress' ? 'Printing' : 'Queued'}
        </Button>
      </div>
    )
  }

  return (
    <div onClick={stopRowClick} className={compact ? 'flex justify-end' : undefined}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="secondary" size="sm">
            <Printer className="size-3.5" aria-hidden />
            {isDraft ? 'Lock & queue' : 'Queue'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Queue {batchNumber}</DialogTitle>
            <DialogDescription>
              {isDraft
                ? 'This batch is still a draft. Sending it locks it first, which reserves its filament.'
                : 'Pick the printer that will run this bed.'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="text-muted-foreground text-sm">Reading the fleet…</p>
          ) : options ? (
            <div className="flex flex-col gap-4">
              <Field
                label="Printer"
                htmlFor="queue-machine"
                required
                hint={
                  eligible.length > 0
                    ? `${eligible.length} of ${options.machines.length} have enough spools loaded`
                    : undefined
                }
              >
                <Select
                  id="queue-machine"
                  value={machineId}
                  onChange={e => chooseMachine(e.target.value)}
                  aria-label="Printer to queue this batch on"
                >
                  <option value="">Pick a printer</option>
                  {options.machines.map(machine => (
                    <option key={machine.id} value={machine.id} disabled={!machine.eligible}>
                      {machine.name}
                      {machine.model ? ` (${machine.model})` : ''}
                      {machine.eligible ? '' : ` — ${machine.reason ?? 'cannot take this bed'}`}
                    </option>
                  ))}
                </Select>
                {/* What the chosen printer is actually holding, and WHERE.
                    An <option> cannot draw a swatch, and when Tensor cannot
                    verify the colours itself this is the only way the operator
                    can do the comparison - the bed's colours are above, the
                    machine's are here, side by side. The slot number is what
                    turns "it has blue somewhere" into something you can walk
                    over and check. */}
                {selected && selected.trays.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1">
                    <span className="text-subtle-foreground text-[10px] tracking-wide uppercase">
                      {selected.name} holds
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.trays.map(tray => (
                        <span
                          key={`${tray.ams_id ?? 'x'}-${tray.tray_id ?? 'x'}-${tray.hex}`}
                          className="border-border flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
                        >
                          <span
                            aria-hidden
                            className="border-border size-3 shrink-0 rounded-full border"
                            style={{ backgroundColor: tray.hex }}
                          />
                          <span className="font-mono tabular-nums">{slotLabel(tray)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Field>

              {selected && options.slots.length > 0 ? (
                <Field
                  label="Which spool prints what"
                  htmlFor="queue-slots"
                  hint="Check these against the machine before sending"
                >
                  <div id="queue-slots">
                    <SlotTrayPicker
                      slots={options.slots}
                      trays={selected.trays}
                      value={slotTrays}
                      onChange={setSlotTrays}
                    />
                  </div>
                </Field>
              ) : null}

              {options.note ? (
                <p className="text-muted-foreground text-xs">{options.note}</p>
              ) : null}
              {error ? (
                <p role="alert" className="text-danger text-sm">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button size="sm" disabled={pending || !machineId} onClick={() => void submit()}>
                  {pending ? 'Sending…' : isDraft ? 'Lock & send' : 'Send to printer'}
                </Button>
              </div>
            </div>
          ) : (
            <p role="alert" className="text-danger text-sm">
              {error ?? 'Could not read which printers can take this batch.'}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
