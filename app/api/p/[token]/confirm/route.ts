import type { NextRequest } from 'next/server'

import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ token: string }>
}

/** The customer confirming their own order. No session; the token is all. */
export async function POST(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token } = await params
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/personalisation/${encodeURIComponent(token)}/confirm`,
    { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10_000) },
  )
  return Response.json(await upstream.json().catch(() => ({})), { status: upstream.status })
}
