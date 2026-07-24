import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  type DesignFileKind,
  DesignServiceError,
  fetchDesignFile,
} from '@/services/designs.service'

interface RouteContext {
  params: Promise<{ id: string; kind: string }>
}

const VALID_KINDS = new Set<DesignFileKind>(['model', 'gcode'])

function isValidKind(kind: string): kind is DesignFileKind {
  return VALID_KINDS.has(kind as DesignFileKind)
}

/**
 * Streams a design's downloadable file (original model or sliced G-code) to the
 * browser. The Tensor-Core bearer token is minted server-side from the session,
 * so the browser never handles it - a plain download link on the detail page
 * hits this route and the bytes are piped straight through without buffering.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { id, kind } = await params
  if (!isValidKind(kind)) {
    return Response.json({ detail: 'Unknown file type.' }, { status: 404 })
  }

  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  try {
    const upstream = await fetchDesignFile(token, id, kind)
    const headers = new Headers({ 'Content-Type': 'application/octet-stream' })
    // Preserve the backend's attachment filename and length when present.
    const disposition = upstream.headers.get('Content-Disposition')
    if (disposition) headers.set('Content-Disposition', disposition)
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
