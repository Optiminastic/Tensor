import type { PillTone } from '@/components/production/tone-pill'
import type { JobStatus, MachineStatus } from '@/components/production/types'

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
