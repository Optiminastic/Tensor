import { headers } from 'next/headers'

import { getSessionSafe, getTokenSafe } from '@/lib/auth'

export interface ResolvedToken {
  token?: string
  error?: string
}

interface CachedToken {
  token: string
  /** Epoch ms after which the token is no longer handed out. */
  reuseUntil: number
}

/**
 * Access tokens already minted, by session id, for reuse while they are valid.
 *
 * Minting is the expensive half of every backend call from this app: getToken
 * re-validates the session and stamps the user's roles into the JWT, which is
 * a round trip to Tensor-Core (fetchUserAuthz) - and it ran on EVERY server
 * action and page, not "every 15 minutes" as the token's lifetime suggests. A
 * registry product switch makes several actions in a row (Next runs them one
 * at a time), so each paid three cross-server round trips before its own call.
 *
 * Reused only for the SAME session, and only while the session itself still
 * validates (checked on every call below), so signing out still cuts access at
 * once. Reused for 3 minutes, not the token's 15: Tensor-Core checks each
 * token's permissions_version on every request (auth/freshness.go), so a token
 * minted before a role change is REFUSED, never honoured - and the short reuse
 * keeps that window, where a re-granted user sees refusals, to 3 minutes while
 * still covering a burst of clicks. Per server instance and in memory; cleared
 * outright past the cap.
 */
const minted = new Map<string, CachedToken>()
const MAX_CACHED = 1000
/** Long enough to cover a burst of actions; see the note above for why not 15. */
const REUSE_MS = 3 * 60 * 1000

/**
 * A Tensor-Core access token for the current session, re-resolving identity
 * server-side. A server action's arguments are client-controlled, so the token
 * must never come from them - it is derived from the request session.
 * Fails closed: no session or no token yields an error, never a default identity.
 */
export async function resolveBackendToken(): Promise<ResolvedToken> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) return { error: 'Your session has expired. Sign in again.' }

  const key = session.session.id
  const cached = minted.get(key)
  if (cached && cached.reuseUntil > Date.now()) return { token: cached.token }

  const fresh = await getTokenSafe(requestHeaders)
  if (!fresh?.token) return { error: 'Could not mint an access token. Sign in again.' }
  if (minted.size >= MAX_CACHED) minted.clear()
  minted.set(key, { token: fresh.token, reuseUntil: Date.now() + REUSE_MS })
  return { token: fresh.token }
}
