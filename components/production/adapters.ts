// Maps Tensor-Core's production DTOs (snake_case, richer) onto the view models the
// production components render. Keeping the mapping in one place lets the list and
// overview pages share it and keeps the components unaware of the wire format.

import type { Batch } from '@/lib/validators/batches'
import type { Machine } from '@/lib/validators/machines'
import type {
  Order,
  OrderAddress as OrderAddressResponse,
  OrderDetail,
  ProductionJob,
} from '@/lib/validators/production'

import type {
  AssemblyStatus,
  BatchRecord,
  BatchStatus,
  JobStatus,
  MachineStatus,
  MachineSummary,
  OrderAddress,
  OrderJobPersonalisation,
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
    jobNumber: job.job_number,
    description: job.description,
    qty: job.quantity,
    status: toQueueStatus(job),
    personalisation: toPersonalisation(job.personalisation_status),
    qc: toQc(job.qc_status),
    packaging: toPackaging(job.packaging_status),
    priority: job.priority,
    createdAt: job.created_at,
    issueReason: job.issue_reason ?? null,
    batchingBlockedReason: job.batching_blocked_reason ?? null,
    printFileId: job.print_file_id ?? null,
    // Defaults to 'ready' rather than 'approval_required': an older backend
    // that does not send this must not make every job look like it needs
    // signing off.
    modelStatus: job.model_status ?? 'ready',
    modelError: job.model_error ?? null,
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
    customerEmail: order.customer_email ?? null,
    customerPhone: order.customer_phone ?? null,
    shopifyCustomerId: order.shopify_customer_id ?? null,
    submittedAt: order.imported_at,
    total: order.total_price,
    status: toOrderStatus(order.financial_status),
    lineItems: [],
    products: [],
    jobCreationError: order.job_creation_error ?? null,

    placedAt: order.placed_at ?? null,
    note: order.note ?? null,
    fulfillmentStatus: order.fulfillment_status ?? null,
    deliveryStatus: order.delivery_status ?? null,
    returnStatus: order.return_status ?? null,
    itemCount: order.item_count ?? 0,
    sourceName: order.source_name ?? null,
    subtotal: order.subtotal_price ?? null,
    totalDiscounts: order.total_discounts ?? null,
    totalShipping: order.total_shipping ?? null,
    amountPaid: order.total_received ?? null,
    discountTitle: order.discount_title ?? null,
    shippingTitle: order.shipping_title ?? null,
    attributes: order.attributes ?? [],
    tags: order.tags ?? [],
    shippingAddress: toOrderAddress(order.shipping_address),
    billingAddress: toOrderAddress(order.billing_address),
  }
}

/**
 * Maps an address, treating one with nothing in it as absent.
 *
 * Shopify hands back an address object with every field null when the app
 * lacks protected-data access, and rendering that produces a panel of empty
 * labels that reads as a bug rather than as missing permission.
 */
function toOrderAddress(a: OrderAddressResponse | null | undefined): OrderAddress | null {
  if (!a) return null
  const address: OrderAddress = {
    name: a.name ?? null,
    address1: a.address1 ?? null,
    address2: a.address2 ?? null,
    city: a.city ?? null,
    province: a.province ?? null,
    zip: a.zip ?? null,
    country: a.country ?? null,
    phone: a.phone ?? null,
  }
  return Object.values(address).some(Boolean) ? address : null
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
    jobNumber: job.job_number,
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

function toAssemblyStatus(status: string): AssemblyStatus {
  if (status === 'completed') return 'completed'
  if (status === 'not_required') return 'not_required'
  return 'pending'
}

export function toJobDetail(job: ProductionJob): ProductionJobDetail {
  return {
    ...toQueueItem(job),
    statusRaw: job.status,
    assemblyStatus: toAssemblyStatus(job.assembly_status),
    held: job.held,
    batchId: job.batch_id ?? null,
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
    printFileId: job.print_file_id ?? null,
    personalisationNote: job.personalisation_notes ?? '',
    personalisationLog: job.personalisation_log ?? [],
    personalisationConfirms: {
      name: job.name_confirmed,
      photo: job.photo_confirmed,
      font: job.font_confirmed,
      colour: job.colour_confirmed,
      variant: job.variant_confirmed,
      approval: job.customer_approval_received,
    },
    personalisationFields: {
      name: job.personalisation_name ?? null,
      font: job.personalisation_font ?? null,
      colour: job.personalisation_colour ?? null,
      variant: job.personalisation_variant ?? null,
    },
    personalisationPhotoFileId: job.personalisation_photo_file_id ?? null,
    variantTitle: job.variant_title ?? null,
    personalisationProperties: job.personalisation_properties ?? [],
  }
}

// toOrderJobPersonalisation shapes one order's job for the order detail page's
// personalisation log - what's ready to batch and what's still pending, and why.
export function toOrderJobPersonalisation(job: ProductionJob): OrderJobPersonalisation {
  return {
    jobId: job.id,
    jobNumber: job.job_number,
    description: job.product_name ?? job.description,
    personalisation: toPersonalisation(job.personalisation_status),
    log: job.personalisation_log ?? [],
  }
}

function toBatchStatus(status: string): BatchStatus {
  if (status === 'open' || status === 'in_progress' || status === 'completed') return status
  return 'pending_approval'
}

export function toBatchRecord(batch: Batch): BatchRecord {
  return {
    id: batch.id,
    hasPriority: batch.has_priority ?? false,
    priorityOrderNumbers: batch.priority_order_numbers ?? [],
    batchNumber: batch.batch_number,
    machineId: batch.machine_id ?? null,
    status: toBatchStatus(batch.status),
    materialShortage: batch.material_shortage,
    unitsPerBed: batch.units_per_bed ?? null,
    totalPrintTimeMinutes: batch.total_print_time_minutes ?? null,
    effectiveTimePerUnitMinutes: batch.effective_time_per_unit_minutes ?? null,
    totalFilamentGrams: batch.total_filament_grams ?? null,
    bedUtilizationPercent: batch.bed_utilization_percent ?? null,
    plateSlicedAt: batch.plate_sliced_at ?? null,
    sliceError: batch.plate_slice_error ?? null,
    printError: batch.print_error ?? null,
    packingStrategy: batch.packing_strategy ?? null,
    jobsCount: batch.jobs_count ?? null,
    orderNumbers: batch.order_numbers ?? [],
    colours: batch.colours ?? [],
    createdAt: batch.created_at,
    occupiedAreaMm2: batch.occupied_area_mm2 ?? null,
    freeAreaMm2: batch.free_area_mm2 ?? null,
    plateBboxXMm: batch.plate_bbox_x_mm ?? null,
    plateBboxYMm: batch.plate_bbox_y_mm ?? null,
    plateBboxZMm: batch.plate_bbox_z_mm ?? null,
  }
}

export function toOrderDetailRecord(order: OrderDetail): OrderRecord {
  return {
    ...toOrderRecord(order),
    lineItems: (order.line_items ?? []).map(item => ({
      sku: item.sku ?? null,
      properties: item.properties ?? [],
      // product_name is what the backend writes today; title/name are
      // Shopify's spellings, still read so an order imported before the
      // rename still shows something other than a placeholder.
      name: item.product_name ?? item.title ?? item.name ?? PLACEHOLDER,
      quantity: item.quantity ?? 1,
      variantTitle: item.variant_title ?? null,
      imageUrl: item.image_url ?? null,
      unitPrice: item.unit_price ?? null,
      discountedUnitPrice: item.discounted_unit_price ?? null,
      lineTotal: item.line_total ?? null,
    })),
    products: (order.products ?? []).map(product => ({
      id: product.id,
      shopifyOrderId: product.shopify_order_id,
      shopifyCustomerId: product.shopify_customer_id ?? null,
      sku: product.sku ?? null,
      productName: product.product_name,
      productImageUrl: product.product_image_url ?? null,
      quantity: product.quantity,
    })),
  }
}
