'use client'

import { Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type MouseEvent } from 'react'

import {
  loadBatchQueueOptions,
  queueBatchToMachineAction,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
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
import type { BatchQueueOptions, BatchStatus } from '@/lib/validators/batches'

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
      setMachineId(
        res.data.machines.find(m => m.suggested)?.id ??
          res.data.machines.find(m => m.eligible)?.id ??
          '',
      )
    })
    return () => {
      cancelled = true
    }
  }, [open, batchId])

  // The row itself opens the batch; nothing in here should.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  async function submit(): Promise<void> {
    if (!machineId) {
      setError('Pick a printer to send this batch to.')
      return
    }
    setPending(true)
    setError(null)
    const res = await queueBatchToMachineAction(brand, batchId, { machine_id: machineId })
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
              <Field label="Colours on this bed" htmlFor="queue-colours">
                <div id="queue-colours" className="flex flex-wrap gap-2">
                  {options.colours.map(colour => (
                    <span
                      key={colour.name}
                      className="border-border flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
                    >
                      <span
                        aria-hidden
                        className="border-border size-3 rounded-full border"
                        style={colour.hex ? { backgroundColor: colour.hex } : undefined}
                      />
                      {colour.name}
                    </span>
                  ))}
                </div>
              </Field>

              <Field
                label="Printer"
                htmlFor="queue-machine"
                required
                hint={
                  options.colours_verified
                    ? eligible.length > 0
                      ? `${eligible.length} of ${options.machines.length} hold these colours`
                      : undefined
                    : 'Colours unverified — compare the swatches yourself'
                }
              >
                <Select
                  id="queue-machine"
                  value={machineId}
                  onChange={e => setMachineId(e.target.value)}
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
                {/* What the chosen printer is actually holding.
                    An <option> cannot draw a swatch, and when Tensor cannot
                    verify the colours itself this is the only way the operator
                    can do the comparison - the bed's colours are above, the
                    machine's are here, side by side. */}
                {selected && selected.loaded.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-subtle-foreground text-[10px] tracking-wide uppercase">
                      {selected.name} holds
                    </span>
                    {selected.loaded.map(hex => (
                      <span
                        key={hex}
                        title={hex}
                        aria-label={hex}
                        className="border-border size-3.5 rounded-full border"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                ) : null}
              </Field>

              {options.note ? (
                <p
                  className={
                    options.colours_verified
                      ? 'text-muted-foreground text-xs'
                      : 'text-warning text-xs'
                  }
                >
                  {options.note}
                </p>
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
