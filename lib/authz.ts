import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getSessionSafe } from '@/lib/auth'
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

// Wrapped in React cache so the layout and the page it renders resolve authz
// once per request instead of each calling the backend.
export const currentAuthz = cache(async (): Promise<CurrentAuthz> => {
  // getSessionSafe, not auth.api.getSession directly: the layouts already
  // resolved the session this request, and that helper is memoised, so going
  // through it reuses their answer instead of paying a second DB-backed
  // session validation before the page can render. It also swallows a thrown
  // session error the same way every other caller does.
  const session = await getSessionSafe(await headers())
  if (!session) return ANON

  const authz = await fetchUserAuthz(session.user.id)
  return { userId: session.user.id, roles: authz.roles, permissions: authz.permissions }
})

/** Whether the caller holds a `resource:action` permission. */
export function can(authz: CurrentAuthz, permission: string): boolean {
  return authz.permissions.includes(permission)
}

/**
 * Server guard for a page: redirect the caller away when they lack `permission`.
 * This is UX and defence-in-depth - it stops a typed URL reaching a screen whose
 * data the backend would refuse - not the security boundary, which stays in
 * Tensor-Core. Call it at the top of a server page component.
 */
export async function requirePermission(permission: string, redirectTo: string): Promise<void> {
  const authz = await currentAuthz()
  if (!can(authz, permission)) redirect(redirectTo)
}
