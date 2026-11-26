import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { fetchPhotoSample } from '@/services/photo-print.service'
import { RegistryServiceError } from '@/services/registry.service'

interface RouteContext {
  params: Promise<{ code: string }>
}

/**
 * Streams a product's photo print sample PDF to the browser.
 *
 * A proxy because the Tensor-Core token is minted server-side and never reaches
 * the browser - the same pattern as the template file route.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { code } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }
  try {
    const upstream = await fetchPhotoSample(token, code)
    const headers = new Headers({ 'Content-Type': 'application/pdf' })
    const disposition = upstream.headers.get('Content-Disposition')
    if (disposition) headers.set('Content-Disposition', disposition)
    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    if (err instanceof RegistryServiceError) {
      return Response.json({ detail: err.message }, { status: 404 })
    }
    throw err
  }
}
