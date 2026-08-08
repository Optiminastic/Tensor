import { headers } from 'next/headers'

import { getSessionSafe, getTokenSafe } from '@/lib/auth'

export interface ResolvedToken {
  token?: string
  error?: string
}

/**
 * Mints a Tensor-Core access token for the current session, re-resolving
 * identity server-side. A server action's arguments are client-controlled, so
 * the token must never come from them - it is derived from the request session.
 * Fails closed: no session or no token yields an error, never a default identity.
 */
export async function resolveBackendToken(): Promise<ResolvedToken> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) return { error: 'Your session has expired. Sign in again.' }

  const minted = await getTokenSafe(requestHeaders)
  if (!minted?.token) return { error: 'Could not mint an access token. Sign in again.' }
  return { token: minted.token }
}
