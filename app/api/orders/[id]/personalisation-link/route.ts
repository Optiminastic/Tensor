import type { NextRequest } from 'next/server'

import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Opens the customer's own personalisation page from the orders table.
 *
 * A REDIRECT RATHER THAN JSON, which is the whole reason this exists beside
 * the production-jobs route that returns the url. The orders row has to open
 * in a new tab, and a tab opened after an await is a popup as far as the
 * browser is concerned - Safari and Firefox block it outright. Redirecting
 * lets the cell be a plain anchor with target="_blank": the browser opens the
 * tab on the click itself and this route tells it where to go.
 *
 * It also keeps live customer links out of the orders list response. The list
 * says only whether a window is open; the token is unsealed here, for the one
 * order somebody actually clicked.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { id } = await params
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return new Response(error ?? 'Your session has expired. Sign in again.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const response = await fetch(
    `${env.TENSOR_CORE_URL}/orders/${encodeURIComponent(id)}/personalisation-link`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    },
  )
  if (!response.ok) {
    return new Response('Could not look up that link.', {
      status: response.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const body: unknown = await response.json()
  const url = typeof body === 'object' && body !== null ? (body as { url?: unknown }).url : null
  if (typeof url !== 'string' || url === '') {
    // The window closed between the page rendering and the click, or this
    // service holds no encryption key and so never kept the token. Said
    // plainly in the new tab rather than redirected somewhere misleading.
    return new Response(
      "This customer's personalisation window has closed, so there is no link to open.",
      { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    )
  }
  // 307: the browser must not cache this. The token behind it is live for
  // thirty minutes and belongs to one order.
  return Response.redirect(url, 307)
}
