'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { BulkOrderInputSchema } from '@/lib/validators/bulk-orders'
import {
  BulkOrderServiceError,
  createBulkOrder,
  deleteBulkOrder,
  getBulkOrder,
  updateBulkOrder,
} from '@/services/bulk-orders.service'

import type { ActionResult } from '../actions'

/**
 * Create and edit quotations.
 *
 * Every one of these forwards the operator's token and lets Tensor-Core do the
 * money. Zod here proves the SHAPE - a quantity is a positive integer, a
 * discount is 0-100 - and nothing more: the prices, the line totals and the
 * grand total are resolved and computed by the backend from the SKUs it is
 * given, because these arguments arrive from a browser and a total that comes
 * with the request is a total the sender picked.
 */

function describe(error: unknown): string {
  if (error instanceof BulkOrderServiceError) return error.message
  return 'Something went wrong. Please try again.'
}

/** Both writes revalidate the list and the quotation, so an edit shows at once. */
function revalidate(brand: string, id?: string): void {
  revalidatePath(`/dashboard/${brand}/production/bulk-orders`)
  if (id) revalidatePath(`/dashboard/${brand}/production/bulk-orders/${id}`)
}

export async function createBulkOrderAction(
  brand: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = BulkOrderInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and retry.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const order = await createBulkOrder(token, brand, parsed.data)
    revalidate(brand, order.id)
    return { ok: true, data: { id: order.id } }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

/**
 * Save an edit.
 *
 * The backend re-resolves every price from Shopify and re-snapshots it, so the
 * quotation this produces reflects today's prices and then stays fixed until
 * somebody edits it again. That is what makes the document change when the
 * order changes, rather than drifting on its own.
 */
export async function updateBulkOrderAction(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (!id.trim()) return { ok: false, error: 'A bulk order is required.' }
  const parsed = BulkOrderInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and retry.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const order = await updateBulkOrder({ token, brand, id, input: parsed.data })
    revalidate(brand, order.id)
    return { ok: true, data: { id: order.id } }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

/**
 * Reject a quotation.
 *
 * A status change, nothing more - the lines and the document stay exactly as
 * they are. It is reversible from the edit form, which is why it needs no
 * confirmation step: a mis-click costs a click, not a quotation.
 *
 * It reuses the update endpoint rather than adding a verb of its own, so the
 * one place that writes a bulk order stays the one place.
 */
export async function rejectBulkOrderAction(brand: string, id: string): Promise<ActionResult> {
  if (!id.trim()) return { ok: false, error: 'A bulk order is required.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const current = await getBulkOrder(token, brand, id)
    await updateBulkOrder({
      token,
      brand,
      id,
      input: {
        customer_name: current.customer_name,
        customer_email: current.customer_email ?? '',
        customer_phone: current.customer_phone ?? '',
        notes: current.notes ?? '',
        order_date: current.order_date,
        valid_until: current.valid_until ?? '',
        status: 'cancelled',
        discount_percent: current.discount_percent,
        lines: current.lines.map(l => ({ sku: l.sku, quantity: l.quantity })),
      },
    })
    revalidate(brand, id)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function deleteBulkOrderAction(brand: string, id: string): Promise<ActionResult> {
  if (!id.trim()) return { ok: false, error: 'A bulk order is required.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await deleteBulkOrder(token, brand, id)
    revalidate(brand)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
