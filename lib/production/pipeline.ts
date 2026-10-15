import type { AttentionItem } from '@/lib/dashboard/analytics'
import type { ProductionJob } from '@/lib/validators/production'

/**
 * Where a job is on the floor, as exactly one stage. Mirrors Tensor-Core's
 * lifecycle (internal/production/lifecycle.go): queued -> in_production ->
 * completed, then the stations in order - assembly, finishing, QC, packing -
 * any of which may be `not_required`.
 */
export type JobStage =
  | 'to_batch'
  | 'batched'
  | 'printing'
  | 'assembly'
  | 'finishing'
  | 'qc'
  | 'packing'
  | 'packed'
  | 'issue'

export type FlowStage = Exclude<JobStage, 'issue'>

export interface PipelineStage {
  key: FlowStage
  label: string
  count: number
}

const FLOW: { key: FlowStage; label: string }[] = [
  { key: 'to_batch', label: 'Needs a bed' },
  { key: 'batched', label: 'On a bed' },
  { key: 'printing', label: 'Printing' },
  { key: 'assembly', label: 'Assembly' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'qc', label: 'QC' },
  { key: 'packing', label: 'Packing' },
  { key: 'packed', label: 'Packed' },
]

// 'printing' is what older rows (and the preview data) carry for in_production.
const PRINTING_STATUSES = new Set(['in_production', 'printing'])

const ISSUE_LABELS: Record<string, string> = {
  sku_missing: 'SKU missing',
  no_approved_design: 'No approved design',
  stl_missing: 'Model file missing',
  colour_missing: 'Colour missing',
  material_missing: 'Material missing',
  profile_missing: 'Printer profile missing',
  filament_out_of_stock: 'Filament out of stock',
}

function isIssue(job: ProductionJob): boolean {
  return (
    job.status === 'failed' || job.held || Boolean(job.issue_reason) || job.qc_status === 'failed'
  )
}

function stationStage(job: ProductionJob): FlowStage {
  if (job.assembly_status === 'pending') return 'assembly'
  if (job.finishing_status === 'pending') return 'finishing'
  if (job.qc_status === 'pending') return 'qc'
  return job.packaging_status === 'packaged' ? 'packed' : 'packing'
}

/** The one stage a job is in right now. */
export function jobStage(job: ProductionJob): JobStage {
  if (isIssue(job)) return 'issue'
  if (PRINTING_STATUSES.has(job.status)) return 'printing'
  if (job.status === 'completed') return stationStage(job)
  return job.batch_id ? 'batched' : 'to_batch'
}

/** Every flow stage with its job count, in floor order. Issues are counted apart. */
export function pipeline(jobs: ProductionJob[]): PipelineStage[] {
  const counts = new Map<JobStage, number>()
  for (const job of jobs) {
    const stage = jobStage(job)
    counts.set(stage, (counts.get(stage) ?? 0) + 1)
  }
  return FLOW.map(stage => ({ ...stage, count: counts.get(stage.key) ?? 0 }))
}

/** The waiting stage holding the most jobs - where work is piling up. Null when nothing waits. */
export function bottleneck(stages: PipelineStage[]): FlowStage | null {
  let busiest: PipelineStage | null = null
  for (const stage of stages) {
    if (stage.key === 'packed' || stage.count === 0) continue
    if (!busiest || stage.count > busiest.count) busiest = stage
  }
  return busiest?.key ?? null
}

const SEVERITY_ORDER: Record<AttentionItem['severity'], number> = { danger: 0, warning: 1 }

function issueReason(job: ProductionJob): string {
  if (job.status === 'failed') return 'Print failed'
  if (job.qc_status === 'failed') return 'Failed QC'
  if (job.held) return 'On hold'
  return ISSUE_LABELS[job.issue_reason ?? ''] ?? job.issue_reason ?? 'Needs a look'
}

/** Jobs a person has to unblock: failures first, then holds and flags. */
export function attentionItems(jobs: ProductionJob[]): AttentionItem[] {
  return jobs
    .filter(isIssue)
    .map(
      (job): AttentionItem => ({
        id: job.id,
        jobNumber: job.job_number,
        title: job.description,
        reason: issueReason(job),
        severity: job.status === 'failed' || job.qc_status === 'failed' ? 'danger' : 'warning',
        photoFileId: null,
      }),
    )
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
