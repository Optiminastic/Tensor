import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ kind: string; id: string }>
}

export const runtime = 'nodejs'

/**
 * Proxies a queue item's plate preview to an <img> tag.
 *
 * The same reasoning as the camera proxy: an <img> cannot send an
 * Authorization header, the Tensor-Core bearer token must not travel in a URL,
 * and BambuBuddy itself sits on a tailnet the browser need not be able to
 * reach. So the token is minted server-side from the session here.
 *
 * A missing preview answers 404 with no body rather than an error page - the
 * board renders a placeholder tile, and a plate without a thumbnail is a
 * cosmetic gap, not a failure worth interrupting anyone over.
 */
export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { kind, id } = await params
  const { token } = await resolveBackendToken()
  if (!token) return new Response(null, { status: 401 })

  const url = `${env.TENSOR_CORE_URL}/printing/queue/thumbnail/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`

  let upstream: Response
  try {
    upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  } catch {
    return new Response(null, { status: 502 })
  }
  if (!upstream.ok || !upstream.body) return new Response(null, { status: upstream.status })

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/png',
      // A plate's preview is generated once from its sliced file and never
      // changes, so re-fetching it on every poll of the board is pure waste.
      'Cache-Control': 'private, max-age=86400, immutable',
    },
  })
}
