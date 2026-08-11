'use client'

import { Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { createDispatch } from '@/app/dashboard/[brand]/production/dispatch-actions'
import type { DispatchReadyOrder } from '@/components/production/types'
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

const EMPTY_FORM = { orderId: '', carrier: '', trackingNumber: '' }

interface DispatchCreateDialogProps {
  brand: string
  // Orders whose every job is packaged and which have no dispatch record yet.
  readyOrders: DispatchReadyOrder[]
}

/** Books a shipment for a packed order. Carrier and tracking are optional
 * here - a courier often hands the tracking number back later, and the record
 * stays 'pending' until someone marks it dispatched. */
export function DispatchCreateDialog({
  brand,
  readyOrders,
}: DispatchCreateDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(): Promise<void> {
    setError(null)
    if (!form.orderId) {
      setError('Pick an order to dispatch.')
      return
    }
    setPending(true)
    const res = await createDispatch(brand, {
      order_id: form.orderId,
      carrier: form.carrier.trim() || null,
      tracking_number: form.trackingNumber.trim() || null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not create the dispatch order.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) {
          setForm(EMPTY_FORM)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" disabled={readyOrders.length === 0}>
          <Truck className="size-3.5" aria-hidden />
          Create dispatch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create dispatch</DialogTitle>
          <DialogDescription>
            Book a shipment for an order whose jobs have all been packed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Order" htmlFor="dispatch-order" required>
            <Select
              id="dispatch-order"
              value={form.orderId}
              onChange={e => setForm(prev => ({ ...prev, orderId: e.target.value }))}
            >
              <option value="">Select a packed order…</option>
              {readyOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber}
                  {order.customerName ? ` — ${order.customerName}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Carrier" htmlFor="dispatch-carrier" hint="Optional">
            <Input
              id="dispatch-carrier"
              value={form.carrier}
              onChange={e => setForm(prev => ({ ...prev, carrier: e.target.value }))}
              placeholder="e.g. Delhivery, Bluedart"
            />
          </Field>
          <Field label="Tracking number" htmlFor="dispatch-tracking" hint="Optional">
            <Input
              id="dispatch-tracking"
              value={form.trackingNumber}
              onChange={e => setForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? 'Saving…' : 'Create dispatch'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
