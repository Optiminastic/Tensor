'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import { DesignServiceError, emailDesignReport as emailRequest } from '@/services/designs.service'

import type { ActionResult } from './actions'

const log = createLogger('DesignReportActions')

function describe(error: unknown): string {
  if (error instanceof DesignServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a design report action')
  return 'Something went wrong. Please try again.'
}

// emailDesignReportForDesign emails the cost-report PDF to a recipient. Read-only
// on the domain (it just builds + sends), so no revalidation.
export async function emailDesignReportForDesign(
  id: string,
  to: string,
): Promise<ActionResult<{ to: string }>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const res = await emailRequest(token, id, to)
    return { ok: true, data: { to: res.to } }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
