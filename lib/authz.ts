import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import type { Role } from '@/lib/validators/authz'
import { fetchUserAuthz } from '@/services/authz.service'

/**
 * The current caller's authorization, resolved server-side from the session.
 *
 * This is UX only: it lets a server component hide actions the caller cannot
 * take. The backend still enforces every permission against the verified token,
 * so a hidden button is never a security boundary (see CLAUDE.md).
 */
export interface CurrentAuthz {
  userId: string | null
  roles: Role[]
  permissions: string[]
}

const ANON: CurrentAuthz = { userId: null, roles: [], permissions: [] }

export async function currentAuthz(): Promise<CurrentAuthz> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return ANON

  const authz = await fetchUserAuthz(session.user.id)
  return { userId: session.user.id, roles: authz.roles, permissions: authz.permissions }
}

/** Whether the caller holds a `resource:action` permission. */
export function can(authz: CurrentAuthz, permission: string): boolean {
  return authz.permissions.includes(permission)
}
