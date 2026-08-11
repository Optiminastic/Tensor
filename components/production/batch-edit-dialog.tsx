'use client'

import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { patchBatchAction } from '@/app/dashboard/[brand]/production/actions'
import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import type { BatchStatus } from '@/components/production/types'
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

// PATCH-settable batch statuses (see production.ValidBatchStatusTarget) -
// pending_approval is the auto-created default, only reachable via creation.
const STATUS_TARGETS: BatchStatus[] = ['open', 'in_progress', 'completed']

interface BatchEditDialogProps {
  brand: string
  batchId: string
  status: BatchStatus
  machineId: string | null
  machines: Machine[]
}

/** Edits a locked-or-later batch's status and assigned machine (the only two
 * user-settable fields a batch has - everything else on it is a computed
 * output of the planner). A Draft batch shows BatchApproveDialog instead. */
export function BatchEditDialog({
  brand,
  batchId,
  status,
  machineId,
  machines,
}: BatchEditDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<BatchStatus>(status)
  const [nextMachineId, setNextMachineId] = useState(machineId ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await patchBatchAction(brand, batchId, {
      status: nextStatus,
      machine_id: nextMachineId || null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not update the batch.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Pencil className="size-3.5" aria-hidden />
          Edit batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit batch</DialogTitle>
          <DialogDescription>
            Change the batch's status or reassign it to a different machine.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Status" htmlFor="batch-edit-status">
            <Select
              id="batch-edit-status"
              value={nextStatus}
              onChange={e => setNextStatus(e.target.value as BatchStatus)}
            >
              {STATUS_TARGETS.map(target => (
                <option key={target} value={target}>
                  {BATCH_STATUS_CONFIG[target].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Machine" htmlFor="batch-edit-machine">
            <Select
              id="batch-edit-machine"
              value={nextMachineId}
              onChange={e => setNextMachineId(e.target.value)}
            >
              <option value="">Unassigned</option>
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
            <Button size="sm" disabled={pending} onClick={() => void save()}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
