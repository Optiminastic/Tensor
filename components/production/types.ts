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
  // Why the batch planner passed this job over, in the planner's own wording -
  // held, personalisation pending, or a validation issue. Null when the job is
  // batchable or already batched. Read-only: it explains, it never causes.
  batchingBlockedReason: string | null
  /**
   * Null when the job has no geometry yet. Every product except the Dual Name
   * Plank needs a person to supply it - a plank is rendered from the
   * customer's own names - so this is what the queue's upload action keys on.
   */
  printFileId: string | null
  /**
   * Whether this job can be printed, and if not, who is waiting on whom:
   * a Dual Name Plank builds itself ('generating'), everything else waits for
   * a person to supply and approve a model ('approval_required').
   */
  modelStatus: ModelStatus
  /** Why a generated model could not be built. Null unless modelStatus is 'failed'. */
  modelError: string | null
}

/** Where a job's geometry comes from and whether it has arrived. */
export type ModelStatus = 'ready' | 'generating' | 'failed' | 'approval_required'

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

/** One Shopify line-item custom attribute, verbatim. */
export interface LineProp {
  name: string
  value: string
}

export interface OrderLineItem {
  name: string
  quantity: number
  sku: string | null
  /** The option string under the product name, e.g. "BABY PINK / NO LIGHT". */
  variantTitle: string | null
  imageUrl: string | null
  /**
   * unitPrice is the price before discount - the figure Shopify strikes
   * through - discountedUnitPrice what was actually charged per unit, and
   * lineTotal the row's total. Strings in the store's own decimal form; they
   * are formatted for display, never summed.
   */
  unitPrice: string | null
  discountedUnitPrice: string | null
  lineTotal: string | null
  /** Every custom attribute the store sent, in the order the customer answered. */
  properties: LineProp[]
}

/**
 * A shipping or billing address.
 *
 * Shopify protected customer data: every field arrives empty until the app has
 * protected-data access, so the UI must render a missing address as absent
 * rather than as a panel of blank labels.
 */
export interface OrderAddress {
  name: string | null
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  zip: string | null
  country: string | null
  phone: string | null
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

  /**
   * Shopify's own order page, mirrored.
   *
   * placedAt is when the customer ordered, as against submittedAt (when Tensor
   * imported it) - weeks apart on a backfill, and it is the customer's date
   * that belongs at the top of the page.
   */
  placedAt: string | null
  note: string | null
  fulfillmentStatus: string | null
  /** The carrier's view; null until something ships. */
  deliveryStatus: string | null
  returnStatus: string | null
  /**
   * Units on the order. Comes from the backend rather than being counted from
   * lineItems, which the list response deliberately leaves empty.
   */
  itemCount: number
  sourceName: string | null
  /**
   * Money as the store stated it, in decimal strings. Null means Shopify never
   * stated the figure, which renders differently from a stated zero.
   *
   * amountPaid is Shopify's "Paid" line - what the customer has actually paid,
   * which differs from `total` on a COD or partly-refunded order.
   */
  subtotal: string | null
  totalDiscounts: string | null
  totalShipping: string | null
  amountPaid: string | null
  discountTitle: string | null
  shippingTitle: string | null
  /** Order-level custom attributes: Shopify's "Additional details" panel. */
  attributes: LineProp[]
  tags: string[]
  shippingAddress: OrderAddress | null
  billingAddress: OrderAddress | null
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
  /**
   * Whether any plank on this bed came from an order that paid for priority
   * dispatch. Any, not all: colour batching routinely puts one priority order
   * on a plate with three standard ones, and requiring all four would leave the
   * Priority tab empty on a floor that has priority work in it.
   */
  hasPriority: boolean
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
  // Why this batch is stuck, at the two points it can be. sliceError means
  // there is no print file; printError means there is one that nothing will
  // pick up. Both null on a healthy batch.
  sliceError: string | null
  printError: string | null
  packingStrategy: string | null
  jobsCount: number | null
  /**
   * The Shopify orders on this bed, ascending and deduplicated. Empty when the
   * batch holds no jobs traceable to an order - a reprint, or one assembled by
   * hand.
   */
  orderNumbers: string[]
  /**
   * The distinct filament colours on this bed. `hex` is empty for a colour the
   * filament shelf does not know, which renders as a name without a swatch.
   */
  colours: { name: string; hex: string }[]
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
  /** "BABY PINK / NO LIGHT" - the colour and light choice as the store sells it. */
  variantTitle: string | null
  /**
   * Every custom attribute the customer filled in, verbatim and in order.
   * The two names and the heart count are only here - personalisationName
   * joins the names into "A & B".
   */
  personalisationProperties: LineProp[]
  personalisationPhotoFileId: string | null
}

// One job's personalisation state, as shown on the order detail page's log -
// a lighter-weight view than ProductionJobDetail (no print/machine facts).
export interface OrderJobPersonalisation {
  jobId: string
  /** The readable identifier, used to address the job in a URL. */
  jobNumber: string
  description: string
  personalisation: PersonalisationStatus
  log: string[]
}
