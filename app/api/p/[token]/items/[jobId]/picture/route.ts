import type { NextRequest } from 'next/server'

import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ token: string; jobId: string }>
}

/**
 * The picture of one item, drawn by Tensor-Core.
 *
 * A proxy beside the model route and for the same reason: TENSOR_CORE_URL is
 * a server-side value and the browser cannot reach the backend itself. The
 * token in the path is the whole authority; the backend decides what it opens.
 *
 * ?view=right asks for the other side, which a Dual Name Plank needs - it
 * carries one name read from each end.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token, jobId } = await params
  const view = request.nextUrl.searchParams.get('view') === 'right' ? '?view=right' : ''
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/personalisation/${encodeURIComponent(token)}` +
      `/items/${encodeURIComponent(jobId)}/picture.png${view}`,
    { cache: 'no-store', signal: AbortSignal.timeout(20_000) },
  )
  if (!upstream.ok || !upstream.body) {
    return Response.json({ detail: 'This preview is still being built.' }, { status: 404 })
  }
  const headers = new Headers({ 'Content-Type': 'image/png' })
  const length = upstream.headers.get('Content-Length')
  if (length) headers.set('Content-Length', length)
  return new Response(upstream.body, { status: 200, headers })
}
