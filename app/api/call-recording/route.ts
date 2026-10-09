import { type NextRequest, NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

/**
 * Streams a call recording from Tensor-Core to an <audio> element.
 *
 * Three hops, and each one is load-bearing. Sarvam's own audio_url
 * authenticates with a browser session on its domain and answers 403 to an API
 * key, so a page cannot link to it. Tensor-Core's recordings proxy does take
 * the key - but the browser cannot hold a backend bearer token, so it cannot
 * call that either. This route sits between: it resolves the token
 * server-side and passes the bytes on.
 *
 * Streamed, never buffered. `response.body` is handed straight back, so a long
 * call does not sit in this process's memory on its way through.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const brand = request.nextUrl.searchParams.get('brand')
  const interaction = request.nextUrl.searchParams.get('interaction')
  if (!brand || !interaction) {
    return NextResponse.json({ detail: 'Name the brand and the call.' }, { status: 400 })
  }

  const { token, error } = await resolveBackendToken()
  if (!token) {
    return NextResponse.json({ detail: error ?? 'Sign in again.' }, { status: 401 })
  }

  const upstream = `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/call-logs/recording?interaction=${encodeURIComponent(interaction)}`

  let response: Response
  try {
    response = await fetch(upstream, {
      headers: requestHeaders(token, request.headers.get('range')),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Tensor-Core is unreachable.' }, { status: 502 })
  }

  if (!response.ok || !response.body) {
    return NextResponse.json({ detail: 'That recording could not be read.' }, { status: 502 })
  }
  return new Response(response.body, {
    status: response.status,
    headers: audioHeaders(response),
  })
}

/**
 * Range is forwarded so the player can seek rather than only play from the
 * start; the backend passes it on to Sarvam, which honours it.
 */
function requestHeaders(token: string, range: string | null): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (range) headers.Range = range
  return headers
}

function audioHeaders(response: Response): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': response.headers.get('content-type') ?? 'audio/wav',
    'Accept-Ranges': 'bytes',
    // A recording never changes, but it is customer data: held in the
    // listener's own browser, never in a shared cache.
    'Cache-Control': 'private, max-age=3600',
  }
  const range = response.headers.get('content-range')
  if (range) headers['Content-Range'] = range
  return headers
}
