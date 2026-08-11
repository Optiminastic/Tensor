'use client'

import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { updateProductionJob } from '@/app/dashboard/[brand]/production/actions'
import { allowedJobPatchFields, type JobPatchField } from '@/components/production/job-patch-fields'
import type { BatchRecord, ProductionJobDetail } from '@/components/production/types'
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
import { Switch } from '@/components/ui/switch'
import type { Role } from '@/lib/validators/authz'

const STATUS_TARGETS = ['queued', 'in_production', 'completed'] as const
const STATUS_LABELS: Record<(typeof STATUS_TARGETS)[number], string> = {
  queued: 'Queued',
  in_production: 'In Production',
  completed: 'Completed',
}
const ASSEMBLY_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'not_required', label: 'Not required' },
] as const
const QC_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
] as const
// Raw backend values ("packaged"), distinct from the queue table's display
// value ("packed" - see toPackaging in adapters.ts).
const PACKAGING_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'packaged', label: 'Packed' },
] as const

interface JobEditDialogProps {
  brand: string
  job: ProductionJobDetail
  batches: BatchRecord[]
  roles: Role[]
}

/** Edits any field Tensor-Core's generic job PATCH allows, gated to the
 * caller's role the same way the backend gates it (see job-patch-fields.ts).
 * Renders nothing if the caller's role can't PATCH any job field at all
 * (e.g. Packaging/QC, who use the dedicated QC/packaging endpoints instead). */
export function JobEditDialog({
  brand,
  job,
  batches,
  roles,
}: JobEditDialogProps): JSX.Element | null {
  const allowed = allowedJobPatchFields(roles)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editableStatus = STATUS_TARGETS.includes(job.statusRaw as (typeof STATUS_TARGETS)[number])
  const [status, setStatus] = useState(editableStatus ? job.statusRaw : STATUS_TARGETS[0])
  const [assemblyStatus, setAssemblyStatus] = useState(job.assemblyStatus)
  const [qcStatus, setQcStatus] = useState(job.qc)
  const [packagingStatus, setPackagingStatus] = useState(
    job.packaging === 'packed' ? 'packaged' : 'pending',
  )
  const [priority, setPriority] = useState(job.priority)
  const [held, setHeld] = useState(job.held)
  const [batchId, setBatchId] = useState(job.batchId ?? '')

  if (allowed.size === 0) return null

  function has(field: JobPatchField): boolean {
    return allowed.has(field)
  }

  async function save(): Promise<void> {
    setPending(true)
    setError(null)
    const payload: Record<string, unknown> = {}
    if (has('status') && editableStatus) payload.status = status
    if (has('assembly_status')) payload.assembly_status = assemblyStatus
    if (has('qc_status')) payload.qc_status = qcStatus
    if (has('packaging_status')) payload.packaging_status = packagingStatus
    if (has('priority')) payload.priority = priority
    if (has('held')) payload.held = held
    if (has('batch_id')) payload.batch_id = batchId || null

    const res = await updateProductionJob(brand, job.id, payload)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not update the job.')
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
          Edit job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit job {job.jobNumber}</DialogTitle>
          <DialogDescription>
            Only the fields your role can change are shown here - everything else on this job
            (material, SKU, print time, personalisation) comes from slicing or the dedicated
            QC/packaging/personalisation flows.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {has('status') ? (
            <Field
              label="Status"
              htmlFor="job-edit-status"
              hint={
                !editableStatus
                  ? 'Failed - reprint via a QC decision, not directly editable.'
                  : undefined
              }
            >
              <Select
                id="job-edit-status"
                value={status}
                disabled={!editableStatus}
                onChange={e => setStatus(e.target.value)}
              >
                {STATUS_TARGETS.map(value => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {has('assembly_status') ? (
            <Field label="Assembly" htmlFor="job-edit-assembly">
              <Select
                id="job-edit-assembly"
                value={assemblyStatus}
                onChange={e => setAssemblyStatus(e.target.value as typeof assemblyStatus)}
              >
                {ASSEMBLY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {has('qc_status') ? (
            <Field label="QC" htmlFor="job-edit-qc">
              <Select
                id="job-edit-qc"
                value={qcStatus}
                onChange={e => setQcStatus(e.target.value as typeof qcStatus)}
              >
                {QC_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {has('packaging_status') ? (
            <Field label="Packaging" htmlFor="job-edit-packaging">
              <Select
                id="job-edit-packaging"
                value={packagingStatus}
                onChange={e => setPackagingStatus(e.target.value)}
              >
                {PACKAGING_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {has('priority') ? (
            <Field label="Priority" htmlFor="job-edit-priority">
              <Input
                id="job-edit-priority"
                type="number"
                data-numeric="true"
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
              />
            </Field>
          ) : null}
          {has('batch_id') ? (
            <Field label="Batch" htmlFor="job-edit-batch">
              <Select
                id="job-edit-batch"
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {has('held') ? (
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <div className="flex flex-col">
                <span className="text-foreground text-sm font-medium">On hold</span>
                <span className="text-muted-foreground text-xs">
                  Pauses the job in the queue without changing its status.
                </span>
              </div>
              <Switch checked={held} onCheckedChange={setHeld} />
            </div>
          ) : null}
        </div>
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
      </DialogContent>
    </Dialog>
  )
}
