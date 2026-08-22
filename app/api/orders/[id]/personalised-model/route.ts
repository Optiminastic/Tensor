import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ id: string }>
}

// A render takes about ten seconds for a plank; a slower product or a cold
// machine needs the headroom.
const RENDER_TIMEOUT_MS = 120_000

/**
 * Streams the personalised model for one line of an order - the customer's own
 * text as printable geometry, generated on demand from the product's template.
 * The browser cannot call the guarded backend directly, so the token is minted
 * server-side and the bytes are piped straight through.
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { id } = await params

  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  // Only the two parameters the backend understands are forwarded, and by name:
  // this route is reached with a session cookie, so it must not become a way to
  // hand arbitrary query strings to an authenticated backend call.
  const incoming = new URL(request.url).searchParams
  const query = new URLSearchParams({ line: incoming.get('line') ?? '0' })
  if (incoming.get('format') === 'png') query.set('format', 'png')
  const target = `${env.TENSOR_CORE_URL}/orders/${encodeURIComponent(id)}/personalised-model?${query.toString()}`

  let upstream: Response
  try {
    upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(RENDER_TIMEOUT_MS),
    })
  } catch {
    return Response.json({ detail: 'Tensor-Core did not respond in time.' }, { status: 504 })
  }

  if (!upstream.ok) {
    const detail = await upstream
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    return Response.json(
      { detail: detail ?? `Could not render the model (${upstream.status}).` },
      { status: upstream.status },
    )
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') ?? 'model/stl',
  })
  const disposition = upstream.headers.get('Content-Disposition')
  if (disposition) headers.set('Content-Disposition', disposition)
  return new Response(upstream.body, { status: 200, headers })
}
