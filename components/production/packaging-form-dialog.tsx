'use client'

import { Box } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { submitJobPackaging } from '@/app/dashboard/[brand]/production/actions'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const EMPTY_FORM = {
  packagingType: '',
  addons: '',
  giftMessage: '',
  fragile: false,
  courierPartner: '',
  invoiceReference: '',
}

interface PackagingFormDialogProps {
  brand: string
  jobId: string
  jobNumber: string
}

/** Records packaging details for a job that has already passed QC - the
 * backend rejects this if qc_status isn't 'passed' yet. */
export function PackagingFormDialog({
  brand,
  jobId,
  jobNumber,
}: PackagingFormDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(): Promise<void> {
    setError(null)
    if (!form.packagingType.trim()) {
      setError('Packaging type is required.')
      return
    }
    setPending(true)
    const res = await submitJobPackaging(brand, jobId, {
      packaging_type: form.packagingType.trim(),
      addons: form.addons.trim() || null,
      gift_message: form.giftMessage.trim() || null,
      fragile: form.fragile,
      courier_partner: form.courierPartner.trim() || null,
      invoice_reference: form.invoiceReference.trim() || null,
      photo_file_id: null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record packaging.')
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
        <Button variant="secondary" size="sm">
          <Box className="size-3.5" aria-hidden />
          Record packaging
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Packaging — {jobNumber}</DialogTitle>
          <DialogDescription>Record how this job was packed and dispatched.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Packaging type" htmlFor="packaging-type" required>
            <Input
              id="packaging-type"
              value={form.packagingType}
              onChange={e => setForm(prev => ({ ...prev, packagingType: e.target.value }))}
              placeholder="e.g. Box, Padded mailer"
            />
          </Field>
          <Field label="Add-ons" htmlFor="packaging-addons" hint="Optional">
            <Textarea
              id="packaging-addons"
              value={form.addons}
              onChange={e => setForm(prev => ({ ...prev, addons: e.target.value }))}
              rows={2}
            />
          </Field>
          <Field label="Gift message" htmlFor="packaging-gift-message" hint="Optional">
            <Textarea
              id="packaging-gift-message"
              value={form.giftMessage}
              onChange={e => setForm(prev => ({ ...prev, giftMessage: e.target.value }))}
              rows={2}
            />
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">Fragile</span>
            <Switch
              checked={form.fragile}
              onCheckedChange={checked => setForm(prev => ({ ...prev, fragile: checked }))}
            />
          </label>
          <Field label="Courier partner" htmlFor="packaging-courier" hint="Optional">
            <Input
              id="packaging-courier"
              value={form.courierPartner}
              onChange={e => setForm(prev => ({ ...prev, courierPartner: e.target.value }))}
            />
          </Field>
          <Field label="Invoice reference" htmlFor="packaging-invoice" hint="Optional">
            <Input
              id="packaging-invoice"
              value={form.invoiceReference}
              onChange={e => setForm(prev => ({ ...prev, invoiceReference: e.target.value }))}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? 'Saving…' : 'Save packaging'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
