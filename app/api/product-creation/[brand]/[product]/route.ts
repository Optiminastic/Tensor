import { type NextRequest, NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

/** The products the page can build, by URL segment. Anything else is a 404. */
const PRODUCTS = new Set(['dnp-photo-frame', 'night-lamp', 'moon-lamp'])

/**
 * Proxies a product build to Tensor-Core and streams the file back.
 *
 * A route handler rather than a server action because the answer is a file -
 * a PNG, a print PDF or a 3MF model - and a server action returns JSON. The token is
 * minted here and never reaches the browser; authorization is Tensor-Core's.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ brand: string; product: string }> },
): Promise<NextResponse> {
  const { brand, product } = await context.params
  if (!PRODUCTS.has(product)) {
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

  let upstream: Response
  try {
    upstream = await fetch(
      `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/product-creation/${product}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        // Photos are downloaded and a 300 dpi page or a 900k-triangle model built.
        signal: AbortSignal.timeout(90_000),
      },
    )
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }

  return relay(upstream)
}

/** Passes the built file through, or the backend's refusal as it was worded. */
async function relay(upstream: Response): Promise<NextResponse> {
  if (!upstream.ok) {
    const payload: unknown = await upstream
      .json()
      .catch(() => ({ detail: 'Could not build the file.' }))
    return NextResponse.json(payload, { status: upstream.status })
  }
  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? 'attachment; filename="product.bin"',
    },
  })
}
