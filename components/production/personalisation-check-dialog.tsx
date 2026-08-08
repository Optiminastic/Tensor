'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { validateJobPersonalisation } from '@/app/dashboard/[brand]/production/actions'
import { PersonalisationFieldsSummary } from '@/components/production/personalisation-fields-summary'
import type { PersonalisationConfirms, ProductionJobDetail } from '@/components/production/types'
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

interface PersonalisationCheckDialogProps {
  brand: string
  job: ProductionJobDetail
}

const CONFIRM_LABELS: Record<keyof PersonalisationConfirms, string> = {
  name: 'Name confirmed',
  photo: 'Photo confirmed',
  font: 'Font confirmed',
  colour: 'Colour confirmed',
  variant: 'Variant confirmed',
  approval: 'Customer approval received',
}

/** Manual personalisation check: the operator confirms each field Shopify
 * captured for this job, then submits. The backend derives personalisation_status
 * from these six flags and never accepts a partial update - so the dialog always
 * round-trips notes and the photo file id even though only the switches change. */
export function PersonalisationCheckDialog({
  brand,
  job,
}: PersonalisationCheckDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirms, setConfirms] = useState<PersonalisationConfirms>(job.personalisationConfirms)
  const [notes, setNotes] = useState(job.personalisationNote)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function resetToJob(): void {
    setConfirms(job.personalisationConfirms)
    setNotes(job.personalisationNote)
    setError(null)
  }

  function toggle(key: keyof PersonalisationConfirms): void {
    setConfirms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function submit(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await validateJobPersonalisation(brand, job.id, {
      name_confirmed: confirms.name,
      photo_confirmed: confirms.photo,
      font_confirmed: confirms.font,
      colour_confirmed: confirms.colour,
      variant_confirmed: confirms.variant,
      customer_approval_received: confirms.approval,
      notes: notes.trim() || null,
      photo_file_id: job.personalisationPhotoFileId,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the personalisation check.')
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
        if (next) resetToJob()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Review personalisation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personalisation check</DialogTitle>
          <DialogDescription>
            Confirm each field the customer submitted. The job is only ready for batching once every
            field below is confirmed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <PersonalisationFieldsSummary job={job} />
          <div className="flex flex-col gap-3">
            {(Object.keys(CONFIRM_LABELS) as (keyof PersonalisationConfirms)[]).map(key => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{CONFIRM_LABELS[key]}</span>
                <Switch checked={confirms[key]} onCheckedChange={() => toggle(key)} />
              </label>
            ))}
          </div>
          <Field label="Notes" htmlFor="personalisation-notes" hint="Visible to other operators">
            <Textarea
              id="personalisation-notes"
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
              {pending ? 'Saving…' : 'Save check'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
