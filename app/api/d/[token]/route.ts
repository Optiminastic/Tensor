import type { NextRequest } from 'next/server'

import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ token: string }>
}

/** The customer submitting their damage report. No session; the token is all. */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token } = await params
  const body = await request.text()
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/damage/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    },
  )
  return Response.json(await upstream.json().catch(() => ({})), { status: upstream.status })
}
