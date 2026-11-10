import { type NextRequest, NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Which shelf each URL segment imports into. Anything else is a 404. */
const BACKEND_PATHS: Record<string, string> = {
  filament: '/filament-inventory',
  items: '/inventory-items',
}

type RouteContext = { params: Promise<{ kind: string }> }

/**
 * Proxies a shelf's bulk import (POST) and its template (GET) to Tensor-Core.
 *
 * A route handler rather than a server action for the same reason as the bulk
 * order upload: a server action takes JSON, and a spreadsheet would have to be
 * base64-encoded into it. The token is minted here and never reaches the
 * browser; authorization stays Tensor-Core's.
 */
async function authorise(
  context: RouteContext,
): Promise<{ base: string; token: string } | NextResponse> {
  const { kind } = await context.params
  const path = BACKEND_PATHS[kind]
  if (!path) return NextResponse.json({ detail: 'Unknown inventory shelf.' }, { status: 404 })
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return NextResponse.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }
  return { base: `${env.TENSOR_CORE_URL}${path}`, token }
}

/** Uploads the workbook; the backend's problem list is forwarded verbatim. */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const auth = await authorise(context)
  if (auth instanceof NextResponse) return auth
  let upstream: Response
  try {
    upstream = await fetch(`${auth.base}/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: await request.formData(),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }
  const payload: unknown = await upstream.json().catch(() => ({
    detail: 'Tensor-Core returned an unreadable response.',
  }))
  return NextResponse.json(payload, { status: upstream.status })
}

/** The blank workbook the importer reads: headings and one example row. */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const auth = await authorise(context)
  if (auth instanceof NextResponse) return auth
  let upstream: Response
  try {
    upstream = await fetch(`${auth.base}/import-template`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }
  if (!upstream.ok) {
    const payload: unknown = await upstream
      .json()
      .catch(() => ({ detail: 'Could not build the template.' }))
    return NextResponse.json(payload, { status: upstream.status })
  }
  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': XLSX,
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? 'attachment; filename="import.xlsx"',
    },
  })
}
