'use client'

/**
 * LOCAL ONLY - gitignored, never reaches main.
 *
 * The machine picker the Batches page used to have. One bed at a time: open
 * it, see every printer and why the refused ones are refused, change which
 * spool prints each plate slot, send it there.
 */
import { Loader2 } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { Batch, BatchQueueOptions, QueueMachine } from '@/lib/validators/batches'

import { queueBatchToMachineAction } from '../batch-jobs-actions'

import { loadQueueOptions } from './manual-queue-actions'

interface ManualQueueListProps {
  brand: string
  batches: Batch[]
}

export function ManualQueueList({ brand, batches }: ManualQueueListProps): JSX.Element {
  const [openID, setOpenID] = useState('')

  return (
    <div className="flex flex-col gap-2">
      {batches.map(b => (
        <div key={b.id} className="border-border rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-mono text-sm tabular-nums">{b.batch_number}</span>
              <span className="text-muted-foreground text-xs">
                {b.status === 'pending_approval' ? 'Draft' : 'Locked'}
                {b.units_per_bed !== null && b.units_per_bed !== undefined
                  ? ` · ${b.units_per_bed} units`
                  : ''}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant={openID === b.id ? 'secondary' : 'primary'}
              onClick={() => setOpenID(openID === b.id ? '' : b.id)}
            >
              {openID === b.id ? 'Close' : 'Choose printer…'}
            </Button>
          </div>
          {openID === b.id ? <MachinePicker brand={brand} batchId={b.id} /> : null}
        </div>
      ))}
    </div>
  )
}

interface MachinePickerProps {
  brand: string
  batchId: string
}

function MachinePicker({ brand, batchId }: MachinePickerProps): JSX.Element {
  const [options, setOptions] = useState<BatchQueueOptions | null>(null)
  const [chosen, setChosen] = useState<QueueMachine | null>(null)
  const [trays, setTrays] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')

  // Loaded on open rather than with the page: the fleet moves, and a list read
  // when the page rendered would offer a printer that has since started a job.
  useEffect(() => {
    let cancelled = false
    setBusy(true)
    void loadQueueOptions(batchId).then(res => {
      if (cancelled) return
      setBusy(false)
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not read this bed’s printers.')
        return
      }
      setOptions(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [batchId])

  function pick(m: QueueMachine): void {
    setChosen(m)
    // The backend's own suggestion, which the operator can then change slot by
    // slot. Without it every send would start from nothing.
    setTrays(m.suggested_slot_trays ?? [])
    setSent('')
    setError('')
  }

  async function send(): Promise<void> {
    if (!chosen) return
    setBusy(true)
    setError('')
    const res = await queueBatchToMachineAction(brand, batchId, {
      machine_id: chosen.id,
      slot_trays: trays,
    })
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not send this bed.')
      return
    }
    if (!res.data.queued) {
      setError(res.data.note)
      return
    }
    setSent(`Sent to ${res.data.machine_name}.`)
  }

  if (busy && options === null) {
    return (
      <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Reading the fleet…
      </p>
    )
  }
  if (error !== '' && options === null) {
    return (
      <p role="alert" className="text-danger mt-3 text-sm">
        {error}
      </p>
    )
  }
  if (options === null) return <></>

  return (
    <div className="mt-3 flex flex-col gap-3 border-t pt-3">
      <div className="flex flex-wrap gap-2">
        {options.slots.map(s => (
          <span key={s.index} className="text-muted-foreground text-xs">
            slot {s.index + 1}: <span className="font-mono">{s.name ?? s.hex}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {options.machines.map(m => (
          <button
            key={m.id}
            type="button"
            disabled={!m.eligible}
            onClick={() => pick(m)}
            className={`flex items-center justify-between rounded border px-2 py-1 text-left text-sm ${
              chosen?.id === m.id ? 'border-accent' : 'border-border'
            } ${m.eligible ? '' : 'opacity-50'}`}
          >
            <span>
              {m.name}{' '}
              <span className="text-muted-foreground text-xs">
                {m.model} · {m.status}
                {m.suggested ? ' · Tensor would pick this' : ''}
              </span>
            </span>
            {!m.eligible ? (
              <span className="text-danger text-xs">
                {m.reason ?? `missing ${m.missing.join(', ')}`}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {chosen ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">
            Which spool prints each slot on {chosen.name}
          </span>
          {options.slots.map((s, i) => (
            <label key={s.index} className="flex items-center gap-2 text-xs">
              <span className="w-28">
                slot {s.index + 1} · {s.name ?? s.hex}
              </span>
              <Select
                value={String(trays[i] ?? '')}
                aria-label={`Spool for slot ${s.index + 1}`}
                onChange={e => {
                  const next = [...trays]
                  next[i] = Number(e.target.value)
                  setTrays(next)
                }}
                className="min-w-56"
              >
                {chosen.trays.map(t => {
                  // The ams_mapping integer the backend expects. 254 is the
                  // external spool, which addresses itself rather than being
                  // flattened into the AMS numbering.
                  const value =
                    t.ams_id === null ||
                    t.ams_id === undefined ||
                    t.tray_id === null ||
                    t.tray_id === undefined
                      ? -1
                      : t.ams_id === 254
                        ? 254
                        : t.ams_id * 4 + t.tray_id
                  return (
                    <option key={`${t.label}-${value}`} value={String(value)}>
                      {t.label ?? t.hex} · {t.hex} ({value})
                    </option>
                  )
                })}
              </Select>
            </label>
          ))}

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void send()}>
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              Send to {chosen.name}
            </Button>
            <span className="text-muted-foreground font-mono text-xs">
              ams_mapping [{trays.join(', ')}]
            </span>
          </div>
        </div>
      ) : null}

      {error !== '' ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {sent !== '' ? (
        <p role="status" className="text-success text-sm">
          {sent}
        </p>
      ) : null}
    </div>
  )
}
