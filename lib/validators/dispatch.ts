import { z } from 'zod'

// dispatchResponse (internal/httpapi/dispatch.go). One shipment record per
// order: created 'pending' by POST /dispatch-orders, flipped to 'dispatched'
// (with dispatched_at) by POST /dispatch-orders/:id/dispatch. It is the last
// stage of the pipeline, after packaging.

export const DispatchStatusSchema = z.enum(['pending', 'dispatched'])
export type DispatchStatus = z.infer<typeof DispatchStatusSchema>

export const DispatchOrderSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  carrier: z.string().nullish(),
  tracking_number: z.string().nullish(),
  status: DispatchStatusSchema,
  dispatched_at: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type DispatchOrder = z.infer<typeof DispatchOrderSchema>

// createDispatchRequest. Carrier and tracking are optional at creation - a
// shipment is often booked before the courier hands back a tracking number.
export const DispatchCreateInputSchema = z.object({
  order_id: z.string().min(1, 'Pick an order to dispatch.'),
  carrier: z.string().nullable(),
  tracking_number: z.string().nullable(),
})
export type DispatchCreateInput = z.infer<typeof DispatchCreateInputSchema>
