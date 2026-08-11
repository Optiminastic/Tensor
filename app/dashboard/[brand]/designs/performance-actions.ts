'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import type { DesignPerformance } from '@/lib/validators/designs'
import { getDesignPerformance } from '@/services/designs-analytics.service'
import { DesignServiceError } from '@/services/designs.service'

import type { ActionResult } from './actions'

/** Load a design's per-product performance (unit economics + sales/production). */
export async function fetchDesignPerformance(id: string): Promise<ActionResult<DesignPerformance>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await getDesignPerformance(token, id) }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof DesignServiceError ? err.message : 'Could not load performance.',
    }
  }
}
