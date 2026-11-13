import { NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

/** A background build's status: queued, building, done or failed. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ brand: string; id: string }> },
): Promise<NextResponse> {
  const { brand, id } = await context.params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return NextResponse.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }
  try {
    const upstream = await fetch(
      `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/product-creation/builds/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      },
    )
    const payload: unknown = await upstream
      .json()
      .catch(() => ({ detail: 'Could not read the build.' }))
    return NextResponse.json(payload, { status: upstream.status })
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }
}
