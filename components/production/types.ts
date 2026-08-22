export type JobStatus = 'completed' | 'failed' | 'printing' | 'queued'

export interface ProductionJob {
  id: string
  jobNumber: string
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
export type AssemblyStatus = 'pending' | 'completed' | 'not_required'
export type QcStatus = 'pending' | 'passed' | 'failed'
export type PackagingStatus = 'pending' | 'packed'

// An order that has cleared packaging (every one of its jobs is packaged) and
// has no dispatch_orders row yet - the Dispatch tab's "book a shipment" list.
export interface DispatchReadyOrder {
  id: string
  orderNumber: string
  customerName: string | null
  jobCount: number
}

export interface ProductionJobQueueItem {
  id: string
  jobNumber: string
  description: string
  qty: number
  status: QueueStatus
  personalisation: PersonalisationStatus
  qc: QcStatus
  packaging: PackagingStatus
  priority: number
  createdAt: string
  // Set when Stage 3 validation flagged this job (missing SKU/design/STL) -
  // it's excluded from auto-batching until a human fixes it, so it's the
  // one case the queue still needs manual Hold/Start controls for.
  issueReason: string | null
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
  sku: string | null
  quantity: number
  options: OrderLineItemOption[]
}

/** One personalisation field the customer filled in on the storefront. */
export interface OrderLineItemOption {
  name: string
  value: string
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
  // Set when the backend gave up creating this order's production jobs. The
  // order has none and never will without a manual retry, so it needs to be
  // visible rather than merely absent from the queue.
  jobCreationError: string | null
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
  // Null while the batch's time is an estimate rather than a slice of this
  // actual bed. Gates "Send to printer": without a plate slice there is no
  // .gcode.3mf to send.
  plateSlicedAt: string | null
  packingStrategy: string | null
  jobsCount: number | null
  createdAt: string
  // Derived from bedUtilizationPercent against the nominal bed area.
  occupiedAreaMm2: number | null
  freeAreaMm2: number | null
  // The merged plate's overall combined size (only populated on the
  // single-batch detail fetch - see toBatchRecord).
  plateBboxXMm: number | null
  plateBboxYMm: number | null
  plateBboxZMm: number | null
}

export interface ProductionJobDetail extends ProductionJobQueueItem {
  // The raw backend status ('queued' | 'in_production' | 'completed' |
  // 'failed'), distinct from `status` (QueueStatus above, which folds in
  // `held` as a pseudo-status) - needed to prefill an edit form with the
  // actual PATCH-able value.
  statusRaw: string
  assemblyStatus: AssemblyStatus
  held: boolean
  batchId: string | null
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
