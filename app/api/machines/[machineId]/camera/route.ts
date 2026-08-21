import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ machineId: string }>
}

// A live stream has no length and never completes on its own, so Next must not
// try to buffer or statically evaluate it.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FALLBACK_DETAIL = 'The camera stream is unavailable.'

/**
 * Reads Tensor-Core's own explanation out of a failed response.
 *
 * Worth the trouble because those messages are actionable - "this machine could
 * not be matched to a printer in BambuBuddy" tells an operator exactly what to
 * fix, where a bare 502 sends them to the wrong place entirely.
 */
async function upstreamDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      return String((body as { detail: unknown }).detail)
    }
  } catch {
    // Not JSON, or an empty body. The fallback is honest about that.
  }
  return FALLBACK_DETAIL
}

/**
 * Proxies a printer's live MJPEG feed to an <img> tag.
 *
 * The browser cannot send an Authorization header from an <img>, and the
 * Tensor-Core bearer token must not travel in a URL. So this route mints the
 * token server-side from the session and streams the response back, exactly as
 * the batch-preview proxy does for STL files.
 *
 * The body is piped through untouched rather than read: an MJPEG response is
 * unbounded, and buffering one would grow until the process died.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { machineId } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  const fps = request.nextUrl.searchParams.get('fps')
  const query = fps ? `?fps=${encodeURIComponent(fps)}` : ''
  const url = `${env.TENSOR_CORE_URL}/machine-fleet/${encodeURIComponent(machineId)}/camera/stream${query}`

  let upstream: Response
  try {
    upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Forwarding the client's abort signal is what tears the whole chain
      // down when the viewer toggles the camera off or leaves the page.
      // Without it the browser stops listening while Tensor-Core keeps pulling
      // frames from the printer indefinitely.
      signal: request.signal,
      cache: 'no-store',
    })
  } catch {
    return Response.json({ detail: 'Could not reach the camera stream.' }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json({ detail: await upstreamDetail(upstream) }, { status: upstream.status })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'multipart/x-mixed-replace',
      'Cache-Control': 'no-store, no-transform',
    },
  })
}
