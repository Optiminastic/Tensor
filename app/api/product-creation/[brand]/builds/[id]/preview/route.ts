import { NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

/** The preview PNG drawn from a finished build's model. */
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
  let upstream: Response
  try {
    upstream = await fetch(
      `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/product-creation/builds/${encodeURIComponent(id)}/preview`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(120_000),
      },
    )
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }
  if (!upstream.ok) {
    const payload: unknown = await upstream
      .json()
      .catch(() => ({ detail: 'Could not read the preview.' }))
    return NextResponse.json(payload, { status: upstream.status })
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/png',
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? 'attachment; filename="preview.png"',
    },
  })
}
