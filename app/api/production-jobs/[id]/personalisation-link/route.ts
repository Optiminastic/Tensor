import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * The customer's own personalisation link, while their window is open.
 *
 * A proxy like the changes route beside it: the button runs in the browser and
 * the Tensor-Core bearer token is minted server-side from the session, so it
 * never reaches the page.
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
    `${env.TENSOR_CORE_URL}/production-jobs/${encodeURIComponent(id)}/personalisation-link`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    },
  )
  return Response.json(await response.json(), { status: response.status })
}
