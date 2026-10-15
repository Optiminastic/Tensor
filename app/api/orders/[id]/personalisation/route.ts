import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * What this order's customer was asked, and what they changed.
 *
 * Its own request rather than part of the detail above: the message has to be
 * fetched from Meta to be rebuilt, and that is a round trip nobody opening the
 * Overview tab should wait for. The tab asks when it is opened.
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
    `${env.TENSOR_CORE_URL}/orders/${encodeURIComponent(id)}/personalisation`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    },
  )
  return Response.json(await response.json(), { status: response.status })
}
