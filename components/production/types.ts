export type JobStatus = 'completed' | 'failed' | 'printing' | 'queued'

export interface ProductionJob {
  id: string
  designName: string
  machine: string
  startedAt: string
  durationHours: number
  status: JobStatus
}

export type MachineStatus = 'printing' | 'idle' | 'offline'

export interface MachineSummary {
  id: string
  name: string
  status: MachineStatus
  jobsToday: number
}

export interface ActivityPoint {
  month: string
  completed: number
  failed: number
}
