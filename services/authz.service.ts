import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type UserAuthz, UserAuthzSchema } from '@/lib/validators/authz'

const log = createLogger('AuthzService')

/** A user with no roles yet. Authenticated, but permitted nothing. */
const NO_AUTHZ: UserAuthz = { roles: [], permissions: [], permissionsVersion: 0 }

const REQUEST_TIMEOUT_MS = 3_000

/**
 * Resolve a user's roles and permissions from Tensor-Core.
 *
 * The backend owns the role/permission tables and is the only writer, so this
 * is a server-to-server read authenticated with a shared secret. It runs when
 * Better Auth mints an access token (roughly every 15 minutes per user), not
 * per request.
 *
 * Fails closed: any error yields no roles and no permissions rather than a
 * token that over-grants. An empty permission set means every backend guard
 * rejects, which is the safe direction.
 */
export async function fetchUserAuthz(userId: string): Promise<UserAuthz> {
  const url = `${env.TENSOR_CORE_URL}/internal/users/${encodeURIComponent(userId)}/authz`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Internal-Secret': env.INTERNAL_API_SECRET,
        Accept: 'application/json',
      },
      // Roles must never be served from a stale HTTP cache.
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      log.error(
        { userId, status: response.status },
        'Authz lookup failed; issuing token with no roles',
      )
      return NO_AUTHZ
    }

    const parsed = UserAuthzSchema.safeParse(await response.json())
    if (!parsed.success) {
      // The backend owns this schema; a mismatch means the contract drifted.
      log.error({ userId, issues: parsed.error.issues }, 'Authz response failed validation')
      return NO_AUTHZ
    }

    return parsed.data
  } catch (error) {
    log.error({ userId, err: error }, 'Authz lookup threw; issuing token with no roles')
    return NO_AUTHZ
  }
}
