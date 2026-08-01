// Maps Tensor-Core's production DTOs (snake_case, richer) onto the view models the
// production components render. Keeping the mapping in one place lets the list and
// overview pages share it and keeps the components unaware of the wire format.

import type { Machine } from '@/lib/validators/machines'
import type { Order, OrderDetail, ProductionJob } from '@/lib/validators/production'

import type {
  JobStatus,
  MachineDetail,
  MachineLiveStatus,
  MachineRecord,
  MachineStatus,
  MachineSummary,
  OrderRecord,
  OrderStatus,
  PackagingStatus,
  PersonalisationStatus,
  ProductionJob as RecentJob,
  ProductionJobDetail,
  ProductionJobQueueItem,
  QcStatus,
  QueueStatus,
} from './types'

const PLACEHOLDER = '-' // stand-in for fields the backend does not store

function toQueueStatus(job: ProductionJob): QueueStatus {
  if (job.status === 'failed') return 'failed'
  if (job.held) return 'on_hold'
  if (job.status === 'in_production') return 'in_progress'
  if (job.status === 'completed') return 'completed'
  return 'queued'
}

function toPersonalisation(status: string): PersonalisationStatus {
  if (status === 'not_required') return 'not_required'
  if (status === 'validated') return 'completed'
  return 'required'
}

function toQc(status: string): QcStatus {
  if (status === 'passed') return 'passed'
  if (status === 'failed') return 'failed'
  return 'pending'
}

function toPackaging(status: string): PackagingStatus {
  return status === 'packaged' ? 'packed' : 'pending'
}

export function toQueueItem(job: ProductionJob): ProductionJobQueueItem {
  return {
    id: job.id,
    description: job.description,
    qty: job.quantity,
    status: toQueueStatus(job),
    personalisation: toPersonalisation(job.personalisation_status),
    qc: toQc(job.qc_status),
    packaging: toPackaging(job.packaging_status),
    priority: job.priority,
    createdAt: job.created_at,
  }
}

function toMachineLive(status: string): MachineLiveStatus {
  return status === 'online' ? 'online' : 'offline'
}

export function toMachineRecord(machine: Machine): MachineRecord {
  return {
    id: machine.id,
    name: machine.name,
    status: toMachineLive(machine.status),
    addedAt: '',
  }
}

function toOrderStatus(financial: string): OrderStatus {
  if (financial === 'paid') return 'paid'
  if (financial === 'refunded' || financial === 'partially_refunded') return 'refunded'
  if (financial === 'voided' || financial === 'cancelled') return 'cancelled'
  return 'pending'
}

export function toOrderRecord(order: Order): OrderRecord {
  return {
    id: order.id,
    orderNumber: order.order_number,
    store: '',
    customer: order.customer_name ?? null,
    submittedAt: order.imported_at,
    total: order.total_price,
    status: toOrderStatus(order.financial_status),
    lineItems: [],
  }
}

function toJobStatus(job: ProductionJob): JobStatus {
  if (job.status === 'completed') return 'completed'
  if (job.status === 'failed') return 'failed'
  if (job.status === 'in_production') return 'printing'
  return 'queued'
}

// toRecentJob shapes a job for the Overview's recent-jobs table. There is no
// machine name on a job, so the nozzle profile stands in.
export function toRecentJob(job: ProductionJob): RecentJob {
  return {
    id: job.id,
    designName: job.product_name ?? job.description,
    machine: job.nozzle_profile ?? '-',
    startedAt: job.created_at,
    durationHours: (job.estimated_print_time_minutes ?? 0) / 60,
    status: toJobStatus(job),
  }
}

function toMachineSummaryStatus(status: string): MachineStatus {
  if (status === 'busy') return 'printing'
  if (status === 'online') return 'idle'
  return 'offline'
}

// toMachineSummary shapes a machine for the Overview's machine carousel. Per-machine
// job counts are not exposed yet, so jobsToday is 0.
export function toMachineSummary(machine: Machine): MachineSummary {
  return {
    id: machine.id,
    name: machine.name,
    status: toMachineSummaryStatus(machine.status),
    jobsToday: 0,
  }
}

export function toJobDetail(job: ProductionJob): ProductionJobDetail {
  return {
    ...toQueueItem(job),
    shopifyOrderId:
      job.shopify_order_id === null || job.shopify_order_id === undefined
        ? PLACEHOLDER
        : String(job.shopify_order_id),
    sku: job.sku ?? PLACEHOLDER,
    material: job.material ?? PLACEHOLDER,
    colourProfile: job.colour ?? PLACEHOLDER,
    machineProfile: job.nozzle_profile ?? PLACEHOLDER,
    filamentRequirementG: job.filament_grams_required ?? 0,
    estimatedPrintTimeMin: job.estimated_print_time_minutes ?? 0,
    dueDate: job.due_date ?? '',
    printFileAvailable: job.print_file_id !== null && job.print_file_id !== undefined,
    personalisationNote: job.personalisation_notes ?? '',
  }
}

// The backend machine has a single nozzle and no IP / photo / machine number, so
// those detail fields fall back to placeholders.
export function toMachineDetail(machine: Machine): MachineDetail {
  return {
    ...toMachineRecord(machine),
    machineNumber: PLACEHOLDER,
    ipAddress: PLACEHOLDER,
    leftNozzleMm: machine.nozzle_mm,
    rightNozzleMm: machine.nozzle_mm,
    availableFilaments: machine.supported_filaments.map(f => f.material),
    imageSrc: '/production/h2c-printer.png',
  }
}

export function toOrderDetailRecord(order: OrderDetail): OrderRecord {
  return {
    ...toOrderRecord(order),
    lineItems: (order.line_items ?? []).map(item => ({
      name: item.title ?? item.name ?? PLACEHOLDER,
      quantity: item.quantity ?? 1,
    })),
  }
}
