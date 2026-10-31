import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  AccountsReportServiceError,
  fetchAccountsReportFile,
} from '@/services/accounts-report.service'

interface RouteContext {
  params: Promise<{ brand: string; id: string }>
}

/**
 * Streams one day's sales register to the browser.
 *
 * Proxied rather than linked straight at Tensor-Core, for the same reason
 * /api/files/[id] is: the bearer token is minted server-side from the session,
 * so it never reaches the browser. A signed bucket URL would be worse still -
 * a second, unauthenticated way to reach the shop's complete sales figures.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { brand, id } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return Response.json(
      { detail: error ?? 'Your session has expired. Sign in again.' },
      { status: 401 },
    )
  }

  try {
    const upstream = await fetchAccountsReportFile(token, brand, id)
    const headers = new Headers({
      'Content-Type':
        upstream.headers.get('Content-Type') ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const length = upstream.headers.get('Content-Length')
    if (length) headers.set('Content-Length', length)
    // Forwarded, not dropped: this header carries the real filename -
    // sales-register-2026-10-28.xlsx - and is what makes the browser save the
    // file rather than try to render it.
    const disposition = upstream.headers.get('Content-Disposition')
    if (disposition) headers.set('Content-Disposition', disposition)

    return new Response(upstream.body, { status: 200, headers })
  } catch (err) {
    const detail =
      err instanceof AccountsReportServiceError ? err.message : 'Could not read that spreadsheet.'
    return Response.json({ detail }, { status: 502 })
  }
}
