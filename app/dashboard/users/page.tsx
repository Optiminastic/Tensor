import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { type BrandChoice } from '@/components/admin/brand-multi-select'
import { InviteManager } from '@/components/admin/invite-manager'
import { MembersList, type MemberView } from '@/components/admin/members-list'
import { getSessionSafe, getTokenSafe, getUserDirectory } from '@/lib/auth'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import type { Invite, Member } from '@/lib/validators/admin'
import { listInvites, listMembers } from '@/services/admin.service'
import { listBrands } from '@/services/brands.service'

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
  let brands: BrandChoice[] = []
  let members: MemberView[] = []
  let loadError: string | null = null

  try {
    const token = await getTokenSafe(requestHeaders)
    if (token?.token) {
      // Invites are admin-only; a Project Lead skips that call (it would 403).
      const [brandRows, memberRows, inviteRows] = await Promise.all([
        listBrands(token.token),
        listMembers(token.token),
        canManageUsers ? listInvites(token.token) : Promise.resolve<Invite[]>([]),
      ])
      brands = brandRows.map(brand => ({ slug: brand.slug, name: brand.name }))
      members = await withEmails(memberRows)
      invites = inviteRows
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load the team.'
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">People</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          {canManageUsers
            ? 'Invite someone by email and they set their own password. Links work once and expire after 72 hours. Assign the brands each member may work in.'
            : 'View the team and remove junior members. Inviting people and assigning brands is done by an admin.'}
        </p>
      </div>
      {canManageUsers ? (
        <InviteManager initialInvites={invites} brands={brands} loadError={loadError} />
      ) : null}
      <MembersList
        members={members}
        brands={brands}
        currentUserId={session.user.id}
        actorIsAdmin={canManageUsers}
      />
    </main>
  )
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
      brandSlugs: row.brand_slugs,
    }
  })
}
