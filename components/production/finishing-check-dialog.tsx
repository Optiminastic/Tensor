'use client'

import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { submitJobFinishing } from '@/app/dashboard/[brand]/production/finishing-actions'
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

interface FinishingChecks {
  supports_removed: boolean
  sanded: boolean
  seams_cleaned: boolean
  surface_finish_ok: boolean
}

const CHECK_LABELS: Record<keyof FinishingChecks, string> = {
  supports_removed: 'Supports removed',
  sanded: 'Sanded',
  seams_cleaned: 'Seams cleaned',
  surface_finish_ok: 'Surface finish OK',
}

const EMPTY_CHECKS: FinishingChecks = {
  supports_removed: false,
  sanded: false,
  seams_cleaned: false,
  surface_finish_ok: false,
}

interface FinishingCheckDialogProps {
  brand: string
  jobId: string
  jobNumber: string
}

/** Records the finishing checklist for one job (supports, sanding, seams,
 * surface) and advances finishing_status to completed. See skipJobFinishing on
 * the row for a part that needs no finishing at all. */
export function FinishingCheckDialog({
  brand,
  jobId,
  jobNumber,
}: FinishingCheckDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState<FinishingChecks>(EMPTY_CHECKS)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function toggle(key: keyof FinishingChecks): void {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function submit(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await submitJobFinishing(brand, jobId, {
      ...checks,
      notes: notes.trim() || null,
      photo_file_id: null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record the finishing.')
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
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Sparkles className="size-3.5" aria-hidden />
          Record finishing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finishing check — {jobNumber}</DialogTitle>
          <DialogDescription>
            Confirm every finishing step below before this job moves on to QC.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {(Object.keys(CHECK_LABELS) as (keyof FinishingChecks)[]).map(key => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{CHECK_LABELS[key]}</span>
                <Switch checked={checks[key]} onCheckedChange={() => toggle(key)} />
              </label>
            ))}
          </div>
          <Field label="Notes" htmlFor="finishing-notes" hint="Visible to QC">
            <Textarea
              id="finishing-notes"
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
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? 'Saving…' : 'Save finishing'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
