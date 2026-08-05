'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { approveBatchAction } from '@/app/dashboard/[brand]/production/actions'
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
import type { Machine } from '@/lib/validators/machines'

interface BatchApproveDialogProps {
  brand: string
  batchId: string
  assignedMachineId: string | null
  machines: Machine[]
}

/** Locks a Draft batch: reserves filament, promotes the cached preview to the
 * merged plate, and assigns a machine - defaulting to whichever one the
 * scheduler already picked at Draft creation, overridable here. */
export function BatchApproveDialog({
  brand,
  batchId,
  assignedMachineId,
  machines,
}: BatchApproveDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [machineId, setMachineId] = useState(assignedMachineId ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function approve(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await approveBatchAction(brand, batchId, {
      machine_id: machineId || undefined,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not approve the batch.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Approve batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approve batch</DialogTitle>
          <DialogDescription>
            Locks the batch, reserves its filament, and queues it on the assigned machine.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field
            label="Machine"
            htmlFor="approve-machine"
            hint="Leave as scheduled, or override the machine the scheduler picked."
          >
            <Select
              id="approve-machine"
              value={machineId}
              onChange={e => setMachineId(e.target.value)}
            >
              <option value="">
                {assignedMachineId ? 'Scheduled machine' : 'No machine scheduled yet'}
              </option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </Select>
          </Field>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void approve()}>
              {pending ? 'Approving…' : 'Approve'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
