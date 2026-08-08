'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type { DesignOptimization } from '@/lib/validators/designs'
import {
  DesignServiceError,
  getDesignOptimization as optimizeRequest,
} from '@/services/designs.service'

import type { ActionResult } from './actions'

const log = createLogger('DesignOptimizationActions')

function describe(error: unknown): string {
  if (error instanceof DesignServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a design optimization action')
  return 'Something went wrong. Please try again.'
}

// optimizeDesign runs the AI optimization advisor for a costed design and returns
// its report. Read-only (the backend caches the result); no revalidation.
export async function optimizeDesign(id: string): Promise<ActionResult<DesignOptimization>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const data = await optimizeRequest(token, id)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
