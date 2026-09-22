'use client'

import { Layers, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type JSX } from 'react'

import {
  createCustomBatchAction,
  loadBatchableJobs,
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
import type { BatchableOrder } from '@/lib/validators/production'

interface CustomBatchDialogProps {
  brand: string
}

/**
 * Building a bed by hand, from the orders waiting.
 *
 * The planner decides what shares a plate, and for the ordinary run of planks
 * it decides well. It cannot decide everything: a customer rings up wanting
 * their two planks together, a blue spool is nearly out and should be finished
 * off, a reprint ought to ride along with the order it belongs to. None of
 * those is a rule worth teaching the planner, and all of them are obvious to
 * the person looking at the orders.
 *
 * So the list is ORDERS. The job is what goes on the plate and is what gets
 * sent, but nobody building a bed thinks in job numbers — they think "these
 * four customers are waiting", and a list of JOB-1000008 makes them translate.
 *
 * The first pick decides the bed. A plate is sliced once against one filament
 * load, so everything after it must share that colour, material and nozzle
 * setup — and rather than letting somebody choose a second colour and then
 * refusing them, the orders that cannot join stop being offered.
 */
export function CustomBatchDialog({ brand }: CustomBatchDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState<BatchableOrder[]>([])
  const [unitsPerBed, setUnitsPerBed] = useState(4)
  const [chosen, setChosen] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  // Read when the dialog opens, never with the page: the pool changes as beds
  // are planned, and a list fetched at page load would offer orders another bed
  // has since claimed.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    setChosen([])

    void loadBatchableJobs().then(res => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not read the orders waiting.')
        return
      }
      setOrders(res.data.orders)
      setUnitsPerBed(res.data.units_per_bed)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const chosenOrders = useMemo(
    () => orders.filter(o => chosen.includes(rowKey(o))),
    [orders, chosen],
  )
  const bedKey = chosenOrders[0]?.compatibility_key ?? ''
  const placesUsed = chosenOrders.reduce((n, o) => n + o.units, 0)
  const available = orders.filter(o => o.available).length
  // Counted by bed rather than by plank: two orders off one bed rebuild one bed.
  const movingOffLocked = new Set(
    chosenOrders.filter(o => o.bed_locked && o.on_bed).map(o => o.on_bed),
  ).size
  const reprinting = chosenOrders.filter(o => o.reprint).reduce((n, o) => n + o.units, 0)

  function toggle(order: BatchableOrder): void {
    setError('')
    const key = rowKey(order)
    setChosen(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  async function create(): Promise<void> {
    setPending(true)
    setError('')
    // The orders are what was chosen; the jobs underneath are what prints, and
    // they are the jobs that already exist rather than copies of them.
    const jobIds = chosenOrders.flatMap(o => o.job_ids)
    const res = await createCustomBatchAction(brand, { job_ids: jobIds })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not create the batch.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Layers className="size-3.5" aria-hidden />
          Create custom batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Build a bed by hand</DialogTitle>
          <DialogDescription>
            {bedKey
              ? `A ${chosenOrders[0]?.colour_label || 'single'} bed — ${placesUsed} of ${unitsPerBed} places used. Only orders that can share this plate are shown.`
              : `Every unfulfilled order whose model is ready. ${available} of ${orders.length} can go on a bed; the rest say why not. A plate holds ${unitsPerBed} and prints one colour, so the first pick decides what else can go on.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-sm">Reading the orders…</p>
        ) : (
          <OrderPicker
            orders={orders}
            chosen={chosen}
            bedKey={bedKey}
            placesUsed={placesUsed}
            unitsPerBed={unitsPerBed}
            onToggle={toggle}
          />
        )}

        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {chosen.length === 0
              ? 'Nothing chosen yet'
              : `${chosen.length} ${chosen.length === 1 ? 'order' : 'orders'}, ${placesUsed} of ${unitsPerBed} places`}
            {movingOffLocked > 0
              ? ` — rebuilds ${movingOffLocked} locked ${movingOffLocked === 1 ? 'bed' : 'beds'}`
              : ''}
            {reprinting > 0
              ? ` — ${reprinting} already printed, ${reprinting === 1 ? 'a second one' : 'second copies'} will be made`
              : ''}
          </span>
          <Button
            type="button"
            onClick={() => void create()}
            disabled={pending || chosen.length === 0}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            {pending ? 'Creating…' : 'Create batch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface OrderPickerProps {
  orders: BatchableOrder[]
  chosen: string[]
  bedKey: string
  placesUsed: number
  unitsPerBed: number
  onToggle: (order: BatchableOrder) => void
}

function OrderPicker({
  orders,
  chosen,
  bedKey,
  placesUsed,
  unitsPerBed,
  onToggle,
}: OrderPickerProps): JSX.Element {
  // Two different kinds of "cannot pick this", shown two different ways.
  //
  // Colour: once the bed has one, everything that cannot share it is HIDDEN. A
  // greyed row would invite working out why, and the answer — this bed is blue
  // now — is already in the header.
  //
  // Availability: those stay VISIBLE, greyed, with the reason. Somebody opens
  // this having just counted their unfulfilled orders, and quietly showing a
  // fifth of them answers that with a shrug.
  const offered = bedKey
    ? orders.filter(o => o.compatibility_key === bedKey || !o.available)
    : orders

  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nothing is outstanding. Every unfulfilled order has been printed.
      </p>
    )
  }

  return (
    <div className="border-border max-h-80 overflow-y-auto rounded-md border">
      {offered.map(order => {
        const key = rowKey(order)
        const picked = chosen.includes(key)
        // Full means full: a bed with three of four places cannot take an order
        // of two, and offering it only to refuse on create wastes the click.
        const wouldOverflow = !picked && placesUsed + order.units > unitsPerBed
        const blocked = !order.available || wouldOverflow
        return (
          <label
            key={key}
            className={`border-border flex items-center gap-3 border-b p-2 text-sm last:border-b-0 ${
              blocked ? 'opacity-50' : 'hover:bg-surface-muted cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={picked}
              disabled={blocked}
              onChange={() => onToggle(order)}
              aria-label={`Add order ${order.order_number} to this bed`}
            />
            <span className="font-mono text-xs tabular-nums">{order.order_number}</span>
            <span className="min-w-0 flex-1 truncate">{describe(order)}</span>
            <span className="text-muted-foreground text-xs">{order.colour_label}</span>
            {order.units > 1 ? (
              <span className="font-mono text-xs tabular-nums">×{order.units}</span>
            ) : null}
            {!order.available ? (
              <span className="text-subtle-foreground text-xs">
                {order.unavailable_reason}
                {order.on_bed ? ` ${order.on_bed}` : ''}
              </span>
            ) : order.reprint ? (
              // Already printed. Where it actually is matters more than that it
              // can be picked: "waiting for QC" is usually the real answer to
              // why the order is still open, and a second plank is a deliberate
              // choice rather than the obvious one.
              <span className="text-warning text-xs">
                {order.finished_stage} — picking it reprints
              </span>
            ) : order.on_bed ? (
              <span
                className={
                  order.bed_locked ? 'text-warning text-xs' : 'text-subtle-foreground text-xs'
                }
              >
                {order.bed_locked ? `moves off locked ${order.on_bed}` : `on ${order.on_bed}`}
              </span>
            ) : null}
          </label>
        )
      })}
      {/* Counts only what could still be added, so a list full of greyed rows
          does not read as "there is more to pick". */}
      {bedKey && offered.filter(o => o.available && !chosen.includes(rowKey(o))).length === 0 ? (
        <p className="text-muted-foreground p-3 text-center text-xs">
          No other order outstanding matches this bed.
        </p>
      ) : null}
    </div>
  )
}

/**
 * A row's identity: the order AND its colour.
 *
 * One order appears twice when it holds two colours, because those cannot share
 * a plate — so the order number alone would collapse two distinct rows into one
 * and tick both when either was chosen.
 */
function rowKey(order: BatchableOrder): string {
  return `${order.order_number}:${order.compatibility_key}`
}

/**
 * What the order is for, in one line.
 *
 * Several planks of the same product read as one name rather than the name
 * three times; a genuinely mixed order names each.
 */
function describe(order: BatchableOrder): string {
  const named = order.products.filter(Boolean)
  if (named.length === 0) return 'Untitled product'
  return [...new Set(named)].join(', ')
}
