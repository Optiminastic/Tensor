import type { NextRequest } from 'next/server'

import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ token: string; jobId: string }>
}

/**
 * Streams one item's model to the customer's own page.
 *
 * A proxy rather than a direct call, because TENSOR_CORE_URL is a server-side
 * value and the browser has no way to reach the backend on its own. No session
 * is involved: the token in the path is the authority, and the backend decides
 * whether it opens anything.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token, jobId } = await params
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/personalisation/${encodeURIComponent(token)}` +
      `/items/${encodeURIComponent(jobId)}/model`,
    { cache: 'no-store', signal: AbortSignal.timeout(20_000) },
  )
  if (!upstream.ok || !upstream.body) {
    return Response.json({ detail: 'This preview is still being built.' }, { status: 404 })
  }
  const headers = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
  })
  const length = upstream.headers.get('Content-Length')
  if (length) headers.set('Content-Length', length)
  return new Response(upstream.body, { status: 200, headers })
}
