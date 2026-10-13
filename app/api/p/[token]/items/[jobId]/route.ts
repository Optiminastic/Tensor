import type { NextRequest } from 'next/server'

import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ token: string; jobId: string }>
}

/**
 * The customer saving a correction to their own order.
 *
 * A proxy, like the model route beside it: TENSOR_CORE_URL is server-side and
 * the browser cannot reach the backend on its own. No session - the token in
 * the path is the authority, and the backend decides what it opens and what
 * may be changed.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token, jobId } = await params
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/personalisation/${encodeURIComponent(token)}` +
      `/items/${encodeURIComponent(jobId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    },
  )
  return Response.json(await upstream.json().catch(() => ({})), { status: upstream.status })
}

/**
 * One item, for a page waiting on its own re-render.
 *
 * Cheaper than re-reading the whole order every few seconds, and the model id
 * it carries is the only thing changing.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token, jobId } = await params
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/personalisation/${encodeURIComponent(token)}` +
      `/items/${encodeURIComponent(jobId)}`,
    { cache: 'no-store', signal: AbortSignal.timeout(10_000) },
  )
  return Response.json(await upstream.json().catch(() => ({})), { status: upstream.status })
}
