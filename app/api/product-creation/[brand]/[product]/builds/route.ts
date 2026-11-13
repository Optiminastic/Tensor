import { type NextRequest, NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

/** The products whose print file is built in the background. */
const BUILT_IN_BACKGROUND = new Set(['moon-lamp', 'pdnp-front-text'])

/** Starts (or reuses) a background build of a product's print file. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ brand: string; product: string }> },
): Promise<NextResponse> {
  const { brand, product } = await context.params
  if (!BUILT_IN_BACKGROUND.has(product)) {
    return NextResponse.json({ detail: 'Unknown product.' }, { status: 404 })
  }
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return NextResponse.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }
  const body: unknown = await request.json().catch(() => ({}))
  try {
    const upstream = await fetch(
      `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/product-creation/${product}/builds`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      },
    )
    const payload: unknown = await upstream
      .json()
      .catch(() => ({ detail: 'Could not start the build.' }))
    return NextResponse.json(payload, { status: upstream.status })
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }
}
