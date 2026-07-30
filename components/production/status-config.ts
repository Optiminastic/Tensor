import type { PillTone } from '@/components/production/tone-pill'
import type {
  JobStatus,
  MachineLiveStatus,
  MachineStatus,
  PackagingStatus,
  PersonalisationStatus,
  QcStatus,
  QueueStatus,
} from '@/components/production/types'

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

export const MACHINE_LIVE_STATUS_CONFIG: Record<
  MachineLiveStatus,
  { label: string; tone: PillTone }
> = {
  online: { label: 'Online', tone: 'success' },
  offline: { label: 'Offline', tone: 'muted' },
}

export const QUEUE_STATUS_CONFIG: Record<QueueStatus, { label: string; tone: PillTone }> = {
  queued: { label: 'Queued', tone: 'muted' },
  in_progress: { label: 'In Progress', tone: 'accent' },
  on_hold: { label: 'On Hold', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
}

export const PERSONALISATION_STATUS_CONFIG: Record<
  PersonalisationStatus,
  { label: string; tone: PillTone }
> = {
  not_required: { label: 'Not Required', tone: 'muted' },
  required: { label: 'Required', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
}

export const QC_STATUS_CONFIG: Record<QcStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'muted' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const PACKAGING_STATUS_CONFIG: Record<PackagingStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'muted' },
  packed: { label: 'Packed', tone: 'success' },
}
