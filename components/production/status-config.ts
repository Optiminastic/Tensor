import type { PillTone } from '@/components/production/tone-pill'
import type {
  AssemblyStatus,
  BatchStatus,
  JobStatus,
  MachineStatus,
  OrderStatus,
  PackagingStatus,
  PersonalisationStatus,
  QcStatus,
  QueueStatus,
} from '@/components/production/types'
import type { FleetMachineStatus } from '@/lib/validators/machine-fleet'

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; tone: PillTone }> = {
  completed: { label: 'Completed', tone: 'success' },
  printing: { label: 'Printing', tone: 'accent' },
  queued: { label: 'Queued', tone: 'muted' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const MACHINE_STATUS_CONFIG: Record<MachineStatus, { label: string; tone: PillTone }> = {
  printing: { label: 'Printing', tone: 'accent' },
  idle: { label: 'Idle', tone: 'success' },
  offline: { label: 'Offline', tone: 'danger' },
}

export const QUEUE_STATUS_CONFIG: Record<QueueStatus, { label: string; tone: PillTone }> = {
  queued: { label: 'Queued', tone: 'muted' },
  in_progress: { label: 'In Progress', tone: 'accent' },
  on_hold: { label: 'On Hold', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const PERSONALISATION_STATUS_CONFIG: Record<
  PersonalisationStatus,
  { label: string; tone: PillTone }
> = {
  not_required: { label: 'None', tone: 'muted' },
  required: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Verified', tone: 'success' },
}

export const ASSEMBLY_STATUS_CONFIG: Record<AssemblyStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  not_required: { label: 'Not required', tone: 'muted' },
}

export const QC_STATUS_CONFIG: Record<QcStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const PACKAGING_STATUS_CONFIG: Record<PackagingStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  packed: { label: 'Packed', tone: 'success' },
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; tone: PillTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  refunded: { label: 'Refunded', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const BATCH_STATUS_CONFIG: Record<BatchStatus, { label: string; tone: PillTone }> = {
  pending_approval: { label: 'Draft', tone: 'warning' },
  open: { label: 'Locked', tone: 'accent' },
  in_progress: { label: 'Printing', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
}

export const FLEET_MACHINE_STATUS_CONFIG: Record<
  FleetMachineStatus,
  { label: string; tone: PillTone }
> = {
  idle: { label: 'Idle', tone: 'success' },
  running: { label: 'Running', tone: 'accent' },
  off: { label: 'Off', tone: 'muted' },
}
