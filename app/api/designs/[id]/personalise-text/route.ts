import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { fetchPersonaliseText } from '@/services/designs-personalisation.service'
import { DesignServiceError } from '@/services/designs.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Streams just the extruded name as its own STL, so the live editor can render it
 * as a separate, movable object on top of the model. The text/size ride along as
 * query params; the Tensor-Core bearer token is minted server-side from the
 * session, so the browser never handles it. Bytes are piped straight through.
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

  const search = new URL(request.url).search

  try {
    const upstream = await fetchPersonaliseText(token, id, search)
    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
    })
    const length = upstream.headers.get('Content-Length')
    if (length) headers.set('Content-Length', length)
    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    if (err instanceof DesignServiceError) {
      return Response.json({ detail: err.message }, { status: 404 })
    }
    throw err
  }
}
