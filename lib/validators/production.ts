import { z } from 'zod'

// Mirrors of Tensor-Core's production DTOs (snake_case). The frontend validates
// every response against these; the backend is the source of truth.

// productionJobResponse (internal/httpapi/production_jobs.go). Only the fields the
// UI uses are declared; unknown keys are stripped by Zod.
export const ProductionJobSchema = z.object({
  id: z.string(),
  job_number: z.string(),
  order_id: z.string().nullish(),
  batch_id: z.string().nullish(),
  description: z.string(),
  quantity: z.number(),
  status: z.string(),
  assembly_status: z.string(),
  qc_status: z.string(),
  packaging_status: z.string(),
  personalisation_status: z.string(),
  priority: z.number(),
  held: z.boolean(),
  due_date: z.string().nullish(),
  sku: z.string().nullish(),
  product_name: z.string().nullish(),
  material: z.string().nullish(),
  colour: z.string().nullish(),
  nozzle_profile: z.string().nullish(),
  filament_grams_required: z.number().nullish(),
  estimated_print_time_minutes: z.number().nullish(),
  print_file_id: z.string().nullish(),
  shopify_order_id: z.number().nullish(),
  personalisation_notes: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type ProductionJob = z.infer<typeof ProductionJobSchema>

// orderResponse (internal/httpapi/orders.go).
export const OrderSchema = z.object({
  id: z.string(),
  shopify_order_id: z.number(),
  order_number: z.string(),
  customer_name: z.string().nullish(),
  financial_status: z.string(),
  total_price: z.number(),
  currency: z.string(),
  status: z.string(),
  imported_at: z.string(),
})
export type Order = z.infer<typeof OrderSchema>

// orderDetailResponse adds the raw Shopify line items. They vary, so only the
// fields the UI reads are declared and the rest are ignored.
export const OrderLineItemSchema = z.object({
  title: z.string().nullish(),
  name: z.string().nullish(),
  quantity: z.number().nullish(),
})
export const OrderDetailSchema = OrderSchema.extend({
  line_items: OrderLineItemSchema.array().nullish(),
})
export type OrderDetail = z.infer<typeof OrderDetailSchema>

// filamentResponse (internal/httpapi/filament.go). Inventory is an aggregate
// grams-per-(material, colour), with a reorder threshold - not per-spool.
export const FilamentSchema = z.object({
  id: z.string(),
  material: z.string(),
  colour: z.string().nullish(),
  grams_available: z.number(),
  reorder_level_grams: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Filament = z.infer<typeof FilamentSchema>

// filamentUpsertRequest - keyed on (material, colour); POST upserts.
export const FilamentInputSchema = z.object({
  material: z.string().min(1, 'Material is required').max(255),
  colour: z.string().max(255).optional(),
  grams_available: z.number().min(0, 'Must be zero or more'),
  reorder_level_grams: z.number().min(0, 'Must be zero or more'),
})
export type FilamentInput = z.infer<typeof FilamentInputSchema>
