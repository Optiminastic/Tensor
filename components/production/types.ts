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

// One product within an order - the commerce-facing shape (SKU, name, image),
// linked back to the order's Shopify order ID and customer ID.
export interface OrderProduct {
  id: string
  shopifyOrderId: number
  shopifyCustomerId: number | null
  sku: string | null
  productName: string
  productImageUrl: string | null
  quantity: number
}

export interface OrderRecord {
  id: string
  orderNumber: string
  store: string
  customer: string | null
  customerEmail: string | null
  customerPhone: string | null
  shopifyCustomerId: number | null
  submittedAt: string
  total: number
  status: OrderStatus
  lineItems: OrderLineItem[]
  products: OrderProduct[]
}

export interface PersonalisationConfirms {
  name: boolean
  photo: boolean
  font: boolean
  colour: boolean
  variant: boolean
  approval: boolean
}

export interface PersonalisationFields {
  name: string | null
  font: string | null
  colour: string | null
  variant: string | null
}

export type BatchStatus = 'pending_approval' | 'open' | 'in_progress' | 'completed'

export interface BatchRecord {
  id: string
  batchNumber: string
  machineId: string | null
  status: BatchStatus
  materialShortage: boolean
  unitsPerBed: number | null
  totalPrintTimeMinutes: number | null
  effectiveTimePerUnitMinutes: number | null
  totalFilamentGrams: number | null
  bedUtilizationPercent: number | null
  packingStrategy: string | null
  jobsCount: number | null
  createdAt: string
  // The merged plate's overall combined size (only populated on the
  // single-batch detail fetch - see toBatchRecord).
  plateBboxXMm: number | null
  plateBboxYMm: number | null
  plateBboxZMm: number | null
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
  printFileId: string | null
  personalisationNote: string
  personalisationLog: string[]
  personalisationConfirms: PersonalisationConfirms
  personalisationFields: PersonalisationFields
  personalisationPhotoFileId: string | null
}

// One job's personalisation state, as shown on the order detail page's log -
// a lighter-weight view than ProductionJobDetail (no print/machine facts).
export interface OrderJobPersonalisation {
  jobId: string
  description: string
  personalisation: PersonalisationStatus
  log: string[]
}
