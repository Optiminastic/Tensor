import { NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

/** The finished file of a background build, streamed through with its name. */
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
      `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/product-creation/builds/${encodeURIComponent(id)}/file`,
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
      .catch(() => ({ detail: 'Could not read the file.' }))
    return NextResponse.json(payload, { status: upstream.status })
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'model/3mf',
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? 'attachment; filename="moon.3mf"',
    },
  })
}
