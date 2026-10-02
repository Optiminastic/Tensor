import { type NextRequest, NextResponse } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

/**
 * Proxies the personalisation upload to Tensor-Core.
 *
 * A route handler rather than a server action, because a server action takes
 * JSON: a spreadsheet would have to be base64-encoded into it, which inflates
 * it by a third and makes the backend decode a string instead of reading a
 * file. This streams the multipart body through unchanged.
 *
 * The token is minted here and never reaches the browser. Authorization is
 * Tensor-Core's - the route behind this is guarded on pricing:generate - so
 * this adds a credential and forwards; it does not decide anything.
 */
export async function POST(
  request: NextRequest,
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

  const url = `${env.TENSOR_CORE_URL}/brands/${encodeURIComponent(brand)}/bulk-orders/${encodeURIComponent(id)}/approve`
  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      // The multipart body and its boundary header are passed through as they
      // arrived; re-encoding here would be a second place for the file to be
      // corrupted.
      body: await request.formData(),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ detail: 'Could not reach Tensor-Core.' }, { status: 502 })
  }

  // The body is forwarded verbatim, status included: the validator's problem
  // list is the whole point of this call, and summarising it here would throw
  // away the sheet and row numbers somebody needs.
  const payload: unknown = await upstream.json().catch(() => ({
    detail: 'Tensor-Core returned an unreadable response.',
  }))
  return NextResponse.json(payload, { status: upstream.status })
}
