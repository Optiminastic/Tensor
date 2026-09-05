import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { BatchServiceError, fetchBatchPreview } from '@/services/batches.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Streams a batch's merged plate to the browser. The Tensor-Core bearer token
 * is minted server-side from the session, so the browser never handles it - the
 * 3D preview's <canvas> fetches this route directly.
 *
 * The plate is a 3MF when every model on the bed carries colour, and an STL
 * otherwise, so nothing here may assume either - the upstream Content-Type is
 * passed through as it arrives.
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

    // Forwarded, not dropped - the same fix /api/files/[id] needed. Tensor-Core
    // names the plate after what is on the bed
    // (`attachment; filename="114556-114557-BLUE.3mf"`), and this header is the
    // only thing carrying that name and its extension to the browser. Without
    // it a download landed as the batch's uuid with no extension, which no
    // slicer will open. The <canvas> fetch is unaffected: fetch() ignores it.
    const disposition = upstream.headers.get('Content-Disposition')
    if (disposition) headers.set('Content-Disposition', disposition)

    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    if (err instanceof BatchServiceError) {
      return Response.json({ detail: err.message }, { status: 404 })
    }
    throw err
  }
}
