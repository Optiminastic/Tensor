import { resolveBackendToken } from '@/lib/backend-token'
import { DamageServiceError, fetchDamageFile } from '@/services/whatsapp-damage.service'

interface RouteContext {
  params: Promise<{ brand: string; reportId: string; fileId: string }>
}

/**
 * Streams one damage photograph or video to the browser.
 *
 * Its own route rather than /api/files/[id] because Tensor-Core serves these
 * from an endpoint scoped to the report AND the brand: a file id on its own
 * means nothing there, so one report's photographs cannot be fetched through
 * another's. The bearer token is minted server-side from the session, so an
 * `<img src>` never carries it - the same pattern as /api/files/[id].
 */
export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { brand, reportId, fileId } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  let upstream: Response
  try {
    upstream = await fetchDamageFile(token, brand, { reportId, fileId })
  } catch (err) {
    if (err instanceof DamageServiceError) {
      return Response.json({ detail: err.message }, { status: 502 })
    }
    throw err
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return new Response(detail || '{"detail":"That file is not available."}', {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(upstream.body, { status: 200, headers: passThrough(upstream) })
}

/**
 * The headers worth carrying from Tensor-Core to the browser.
 *
 * Cache-Control in particular: the bytes never change once stored, so the
 * backend marks them private and long-lived and the browser should stop
 * asking for a photograph it already has.
 */
function passThrough(upstream: Response): Headers {
  const headers = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
  })
  for (const name of ['Content-Length', 'Content-Disposition', 'Cache-Control']) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  return headers
}
