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

export type QueueStatus = 'queued' | 'in_progress' | 'on_hold' | 'completed' | 'failed'
export type PersonalisationStatus = 'not_required' | 'required' | 'completed'
export type QcStatus = 'pending' | 'passed' | 'failed'
export type PackagingStatus = 'pending' | 'packed'

export interface ProductionJobQueueItem {
  id: string
  description: string
  qty: number
  status: QueueStatus
  personalisation: PersonalisationStatus
  qc: QcStatus
  packaging: PackagingStatus
  priority: number
  createdAt: string
}

export type FilamentQuantityUnit = 'kg' | 'count'

export interface FilamentRecord {
  id: string
  material: string
  brand: string
  color: string
  quantity: number
  quantityUnit: FilamentQuantityUnit
  diameterMm: number
  densityGCm3: number
  price: number
}

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'cancelled'

export interface OrderLineItem {
  name: string
  quantity: number
}

export interface OrderRecord {
  id: string
  orderNumber: string
  store: string
  customer: string | null
  submittedAt: string
  total: number
  status: OrderStatus
  lineItems: OrderLineItem[]
}

export interface ProductionJobDetail extends ProductionJobQueueItem {
  shopifyOrderId: string
  sku: string
  material: string
  colourProfile: string
  machineProfile: string
  filamentRequirementG: number
  estimatedPrintTimeMin: number
  dueDate: string
  printFileAvailable: boolean
  personalisationNote: string
}
