import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { BatchServiceError, fetchBatchPreview } from '@/services/batches.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Streams a batch's merged-plate STL to the browser. The Tensor-Core bearer
 * token is minted server-side from the session, so the browser never handles
 * it - the 3D preview's <canvas> fetches this route directly.
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

  try {
    const upstream = await fetchBatchPreview(token, id)
    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') ?? 'model/stl',
    })
    const length = upstream.headers.get('Content-Length')
    if (length) headers.set('Content-Length', length)
    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    if (err instanceof BatchServiceError) {
      return Response.json({ detail: err.message }, { status: 404 })
    }
    throw err
  }
}
