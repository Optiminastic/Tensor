'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type { CatchUpPreview, CatchUpResult } from '@/lib/validators/production-catchup'
import {
  ProductionCatchUpServiceError,
  previewCatchUp,
  runCatchUp,
} from '@/services/production-catchup.service'

const log = createLogger('ProductionCatchUpActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

export async function previewCatchUpAction(brand: string): Promise<ActionResult<CatchUpPreview>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await previewCatchUp(token, brand) }
  } catch (err) {
    if (err instanceof ProductionCatchUpServiceError) return { ok: false, error: err.message }
    log.error({ err }, 'Unexpected preview error')
    return { ok: false, error: 'Something went wrong.' }
  }
}

/**
 * Marks every waiting station done, for goods already shipped.
 *
 * NOT RETRYABLE BLINDLY, and not undoable. The backend checks production:catchup
 * against the token - ADMIN alone holds it - and refuses if the count has moved
 * since the preview.
 */
export async function runCatchUpAction(input: {
  brand: string
  reason: string
  confirm: number
}): Promise<ActionResult<CatchUpResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return {
      ok: true,
      data: await runCatchUp({
        token,
        brand: input.brand,
        reason: input.reason,
        confirm: input.confirm,
      }),
    }
  } catch (err) {
    if (err instanceof ProductionCatchUpServiceError) return { ok: false, error: err.message }
    log.error({ err }, 'Unexpected catch-up error')
    return { ok: false, error: 'Something went wrong.' }
  }
}
