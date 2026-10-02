import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { InviteManager } from '@/components/admin/invite-manager'
import { MembersList, type MemberView } from '@/components/admin/members-list'
import { getSessionSafe, getTokenSafe, getUserDirectory } from '@/lib/auth'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import type { Invite, Member } from '@/lib/validators/admin'
import { listInvites, listMembers } from '@/services/admin.service'

export const metadata: Metadata = { title: 'People' }

export const dynamic = 'force-dynamic'

/**
 * The team roster. Admins (`user:manage`) invite people and assign brands; Project
 * Leads (`user:read`) can view the roster and remove junior members but see no
 * invite tools. Tensor-Core enforces all of this - the UI only mirrors it.
 */
export default async function UsersPage(): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) redirect('/login?callbackUrl=/dashboard/users')

  await requirePermission('user:read', '/dashboard')
  const authz = await currentAuthz()
  const canManageUsers = can(authz, 'user:manage')

  let invites: Invite[] = []
  let members: MemberView[] = []
  let loadError: string | null = null

  // allSettled, not all. These three are independent - brands, the roster and
  // the invite list - and Promise.all made them one failure: a 404 on any of
  // them left every variable at its empty default, so a missing /admin/users
  // route rendered as "No brands exist yet" on a workspace that had a brand,
  // with the real cause named nowhere. Each one now fails on its own and the
  // rest of the page still renders.
  const token = await getTokenSafe(requestHeaders)
  if (token?.token) {
    const accessToken = token.token
    // Invites are admin-only; a Project Lead skips that call (it would 403).
    const [memberResult, inviteResult] = await Promise.allSettled([
      listMembers(accessToken),
      canManageUsers ? listInvites(accessToken) : Promise.resolve<Invite[]>([]),
    ])

    if (memberResult.status === 'fulfilled') {
      members = await withEmails(memberResult.value)
    }
    if (inviteResult.status === 'fulfilled') {
      invites = inviteResult.value
    }

    // One line naming what actually failed, rather than a generic apology. The
    // old message could not distinguish "the backend is down" from "that one
    // route does not exist", which is the difference between waiting and
    // filing a bug.
    const failures = [
      ['Team members', memberResult],
      ['Invitations', inviteResult],
    ] as const
    const broken = failures
      .filter(([, result]) => result.status === 'rejected')
      .map(([label, result]) => `${label}: ${reasonOf(result)}`)
    if (broken.length > 0) loadError = broken.join(' · ')
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">People</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          {canManageUsers
            ? 'Invite someone by email and they set their own password. Links work once and expire after 72 hours. Every role can access every store.'
            : 'View the team and remove junior members. Inviting people is done by an admin.'}
        </p>
      </div>
      {canManageUsers ? <InviteManager initialInvites={invites} loadError={loadError} /> : null}
      <MembersList
        members={members}
        currentUserId={session.user.id}
        actorIsAdmin={canManageUsers}
      />
    </main>
  )
}

/** The message from a settled promise that rejected. */
function reasonOf(result: PromiseSettledResult<unknown>): string {
  if (result.status !== 'rejected') return ''
  return result.reason instanceof Error ? result.reason.message : 'could not be loaded'
}

/** Join Better Auth identities onto the backend's member rows for display. */
async function withEmails(rows: Member[]): Promise<MemberView[]> {
  const directory = await getUserDirectory(rows.map(row => row.user_id))
  return rows.map(row => {
    const identity = directory.get(row.user_id)
    return {
      userId: row.user_id,
      email: identity?.email ?? null,
      name: identity?.name ?? null,
      roles: row.roles,
    }
  })
}
