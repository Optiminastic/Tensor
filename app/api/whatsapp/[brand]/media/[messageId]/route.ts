import { resolveBackendToken } from '@/lib/backend-token'
import { fetchWhatsAppMedia, WhatsAppInboxServiceError } from '@/services/whatsapp-inbox.service'

interface RouteContext {
  params: Promise<{ brand: string; messageId: string }>
}

/**
 * Streams one WhatsApp attachment - a customer's damage photograph, usually -
 * to the browser.
 *
 * Its own route rather than /api/files/[id] because Tensor-Core serves these
 * from a brand-scoped endpoint: the brand is in the query's WHERE clause, so
 * one brand's chat media cannot be fetched under another brand's slug. The
 * bearer token is minted server-side from the session, so an <img src> never
 * carries it - the same pattern as /api/files/[id].
 *
 * A 404 here is meaningful and is passed through rather than flattened: the
 * backend answers one for an attachment still downloading and a different one
 * for an attachment that failed, and the bubble draws those differently.
 */
export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { brand, messageId } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  let upstream: Response
  try {
    upstream = await fetchWhatsAppMedia(token, brand, messageId)
  } catch (err) {
    if (err instanceof WhatsAppInboxServiceError) {
      return Response.json({ detail: err.message }, { status: 502 })
    }
    throw err
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return new Response(detail || '{"detail":"That attachment is not available."}', {
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
