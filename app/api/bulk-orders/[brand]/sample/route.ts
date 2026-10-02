import { NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Streams a generated workbook back from Tensor-Core.
 *
 * The file is produced by the backend from the same sheet definitions its
 * validator uses, so what you download and what it will accept cannot drift.
 * This adds the access token, which the browser does not have, and passes the
 * bytes and the filename through untouched.
 */
async function proxy(path: string, fallbackName: string): Promise<NextResponse> {
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return NextResponse.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }

  if (!upstream.ok) {
    const payload: unknown = await upstream
      .json()
      .catch(() => ({ detail: 'Could not build the spreadsheet.' }))
    return NextResponse.json(payload, { status: upstream.status })
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': XLSX,
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ?? `attachment; filename="${fallbackName}"`,
    },
  })
}

/**
 * A filled-in example across every mapped product, for somebody who wants to
 * see the shape before they have an order in front of them.
 *
 * Built from the registry rather than from any one order, which is why it sits
 * beside the orders rather than under one.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ brand: string }> },
): Promise<NextResponse> {
  const { brand } = await context.params
  return proxy(
    `/brands/${encodeURIComponent(brand)}/bulk-orders/sheet-sample`,
    'bulk-order-sample.xlsx',
  )
}
