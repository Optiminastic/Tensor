'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type { ExceptionActionResult } from '@/lib/validators/shipment-exceptions'
import {
  ShipmentExceptionsServiceError,
  actOnException,
} from '@/services/shipment-exceptions.service'

const log = createLogger('ExceptionActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

/**
 * Presses one of Delhivery's buttons on one exception.
 *
 * NOT RETRYABLE BLINDLY. CTA023 sends a van; CTA002 gives up on the parcel and
 * starts it back to the warehouse. Each call is a real instruction to a real
 * courier, so the page reports what was asked rather than offering a retry.
 *
 * Every argument is client-controlled, which is fine: the backend checks
 * dispatch:manage against the token and scopes the brand, and that is the check
 * that counts. The exception id is Delhivery's, so a made-up one is refused by
 * Delhivery rather than acting on somebody else's parcel.
 */
export async function actOnExceptionAction(input: {
  brand: string
  id: string
  code: string
  bucket: string
}): Promise<ActionResult<ExceptionActionResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await actOnException({ token, ...input }) }
  } catch (err) {
    if (err instanceof ShipmentExceptionsServiceError) return { ok: false, error: err.message }
    log.error({ err }, 'Unexpected exception-action error')
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}
