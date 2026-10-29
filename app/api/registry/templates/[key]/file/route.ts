import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { fetchDesignTemplateFile } from '@/services/design-templates.service'
import { RegistryServiceError } from '@/services/registry.service'

interface RouteContext {
  params: Promise<{ key: string }>
}

/**
 * Streams a design template's .scad to the browser.
 *
 * A proxy rather than a direct link because the Tensor-Core bearer token is
 * minted server-side from the session and must never reach the browser - the
 * same pattern as /api/files/[id]/route.ts.
 *
 * `request` is unused but kept: the Next route signature supplies it, and a
 * handler that drops it is one refactor away from needing it back.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { key } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  try {
    const upstream = await fetchDesignTemplateFile(token, key)
    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/plain; charset=utf-8',
    })
    const length = upstream.headers.get('Content-Length')
    if (length) headers.set('Content-Length', length)

    // Forwarded, not rebuilt. Tensor-Core names the file after the template
    // key - `attachment; filename="dnp_heart_joinery.scad"` - and that header
    // is the only thing carrying the real name and extension to the browser.
    // Without it the file saves as the route segment, with no extension, and
    // OpenSCAD will not open it.
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
