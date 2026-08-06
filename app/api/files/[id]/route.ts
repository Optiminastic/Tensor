import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { fetchFile, FileServiceError } from '@/services/files.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Streams a stored file's raw bytes to the browser - a production job's
 * print file, in particular, for the job detail page's 3D preview. The
 * Tensor-Core bearer token is minted server-side from the session, so the
 * browser never handles it - same pattern as
 * /api/batches/[id]/preview/route.ts.
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
    const upstream = await fetchFile(token, id)
    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
    })
    const length = upstream.headers.get('Content-Length')
    if (length) headers.set('Content-Length', length)
    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    if (err instanceof FileServiceError) {
      return Response.json({ detail: err.message }, { status: 404 })
    }
    throw err
  }
}
