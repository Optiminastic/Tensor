import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * What the customer changed on one job's personalisation.
 *
 * A proxy, like /api/files/[id]: the hover card runs in the browser and the
 * Tensor-Core bearer token is minted server-side from the session, so it never
 * reaches the page. Gated by the session exactly as every other staff route
 * is - this is the floor's view of the change, not the customer's own link.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { id } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  const response = await fetch(
    `${env.TENSOR_CORE_URL}/production-jobs/${encodeURIComponent(id)}/personalisation-changes`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    },
  )
  return Response.json(await response.json(), { status: response.status })
}
