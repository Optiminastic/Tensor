'use client'

import { ClipboardCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { submitJobQc } from '@/app/dashboard/[brand]/production/actions'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface QcChecks {
  correct_personalisation: boolean
  correct_colour: boolean
  surface_finish_ok: boolean
  no_cracks: boolean
  no_layer_defects: boolean
  dimensions_ok: boolean
  assembly_fit_ok: boolean
  addons_working: boolean
  packaging_safe: boolean
}

const CHECK_LABELS: Record<keyof QcChecks, string> = {
  correct_personalisation: 'Correct personalisation',
  correct_colour: 'Correct colour',
  surface_finish_ok: 'Surface finish OK',
  no_cracks: 'No cracks',
  no_layer_defects: 'No layer defects',
  dimensions_ok: 'Dimensions OK',
  assembly_fit_ok: 'Assembly fit OK',
  addons_working: 'Add-ons working',
  packaging_safe: 'Safe to package',
}

const EMPTY_CHECKS: QcChecks = {
  correct_personalisation: false,
  correct_colour: false,
  surface_finish_ok: false,
  no_cracks: false,
  no_layer_defects: false,
  dimensions_ok: false,
  assembly_fit_ok: false,
  addons_working: false,
  packaging_safe: false,
}

interface QcCheckDialogProps {
  brand: string
  jobId: string
  jobNumber: string
}

/** Records a QC decision for one job. A fail clones a reprint job at urgent
 * priority on the backend - the operator is told so it isn't a silent drop. */
export function QcCheckDialog({ brand, jobId, jobNumber }: QcCheckDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState<QcChecks>(EMPTY_CHECKS)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [reprintNotice, setReprintNotice] = useState<string | null>(null)

  function toggle(key: keyof QcChecks): void {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function submit(decision: 'pass' | 'fail'): Promise<void> {
    setError(null)
    setPending(true)
    const res = await submitJobQc(brand, jobId, {
      ...checks,
      decision,
      notes: notes.trim() || null,
      photo_file_id: null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record the QC check.')
      return
    }
    if (res.data?.reprint_job) {
      setReprintNotice(`Reprint ${res.data.reprint_job.job_number} was created at urgent priority.`)
      router.refresh()
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
          setChecks(EMPTY_CHECKS)
          setNotes('')
          setError(null)
          setReprintNotice(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <ClipboardCheck className="size-3.5" aria-hidden />
          Run QC
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QC check — {jobNumber}</DialogTitle>
          <DialogDescription>
            Confirm the checklist, then pass or fail. A fail creates a reprint job automatically.
          </DialogDescription>
        </DialogHeader>
        {reprintNotice ? (
          <div className="flex flex-col gap-4">
            <p role="alert" className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm">
              {reprintNotice}
            </p>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setOpen(false)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {(Object.keys(CHECK_LABELS) as (keyof QcChecks)[]).map(key => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">{CHECK_LABELS[key]}</span>
                  <Switch checked={checks[key]} onCheckedChange={() => toggle(key)} />
                </label>
              ))}
            </div>
            <Field label="Notes" htmlFor="qc-notes" hint="Visible to packaging">
              <Textarea
                id="qc-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </Field>
            {error ? (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() => void submit('fail')}
              >
                {pending ? 'Saving…' : 'Fail'}
              </Button>
              <Button size="sm" disabled={pending} onClick={() => void submit('pass')}>
                {pending ? 'Saving…' : 'Pass'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
