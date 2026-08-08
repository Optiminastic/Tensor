'use client'

import { PackageCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { submitJobAssembly } from '@/app/dashboard/[brand]/production/actions'
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

interface AssemblyChecks {
  parts_combined: boolean
  hardware_attached: boolean
  addons_attached: boolean
  fit_check_ok: boolean
}

const CHECK_LABELS: Record<keyof AssemblyChecks, string> = {
  parts_combined: 'Parts combined',
  hardware_attached: 'Hardware attached',
  addons_attached: 'Add-ons attached',
  fit_check_ok: 'Fit check OK',
}

const EMPTY_CHECKS: AssemblyChecks = {
  parts_combined: false,
  hardware_attached: false,
  addons_attached: false,
  fit_check_ok: false,
}

interface AssemblyCheckDialogProps {
  brand: string
  jobId: string
  jobNumber: string
}

/** Records the assembly checklist for one job (parts, hardware, add-ons, fit
 * check) and advances assembly_status to completed. See skipJobAssembly on the
 * row for a job with no assembly step at all. */
export function AssemblyCheckDialog({
  brand,
  jobId,
  jobNumber,
}: AssemblyCheckDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState<AssemblyChecks>(EMPTY_CHECKS)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function toggle(key: keyof AssemblyChecks): void {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function submit(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await submitJobAssembly(brand, jobId, {
      ...checks,
      notes: notes.trim() || null,
      photo_file_id: null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record the assembly.')
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
          <PackageCheck className="size-3.5" aria-hidden />
          Record assembly
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assembly check — {jobNumber}</DialogTitle>
          <DialogDescription>
            Confirm every step below before this job moves on to QC.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {(Object.keys(CHECK_LABELS) as (keyof AssemblyChecks)[]).map(key => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{CHECK_LABELS[key]}</span>
                <Switch checked={checks[key]} onCheckedChange={() => toggle(key)} />
              </label>
            ))}
          </div>
          <Field label="Notes" htmlFor="assembly-notes" hint="Visible to QC">
            <Textarea
              id="assembly-notes"
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
              {pending ? 'Saving…' : 'Save assembly'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
