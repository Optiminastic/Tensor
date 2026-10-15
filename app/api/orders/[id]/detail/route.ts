import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * One order and its production jobs, for the drawer that opens over the table.
 *
 * ON DEMAND, which is the point. The orders table shows a page of fifty, and
 * fetching every order's full detail to serve the one somebody clicks would be
 * fifty round trips for forty-nine answers nobody reads - and the line items
 * alone are 46% of an order's bytes.
 *
 * Both halves in one response and fetched together, not in turn: they need
 * only the token and the id, so awaiting them in sequence makes the second
 * wait out the first for nothing.
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

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  const init = { headers, cache: 'no-store' as const, signal: AbortSignal.timeout(10_000) }
  const [orderRes, jobsRes] = await Promise.all([
    fetch(`${env.TENSOR_CORE_URL}/orders/${encodeURIComponent(id)}`, init),
    fetch(`${env.TENSOR_CORE_URL}/production-jobs?order_id=${encodeURIComponent(id)}`, init),
  ])

  if (!orderRes.ok) {
    return Response.json({ detail: 'That order could not be loaded.' }, { status: orderRes.status })
  }
  const order: unknown = await orderRes.json()
  // The jobs are a detail of the detail: an order still reads correctly
  // without them, so a failure here empties the list rather than failing the
  // drawer.
  const jobs: unknown = jobsRes.ok ? await jobsRes.json() : []
  return Response.json({ order, jobs })
}
