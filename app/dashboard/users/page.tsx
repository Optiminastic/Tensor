import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { InviteManager } from '@/components/admin/invite-manager'
import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import type { Invite } from '@/lib/validators/admin'
import { listInvites } from '@/services/admin.service'

export const metadata: Metadata = { title: 'People' }

export const dynamic = 'force-dynamic'

/**
 * Where an admin creates accounts.
 *
 * The redirect below is UX, not security: it saves a signed-out visitor from a
 * broken-looking page. Authorization is decided by Tensor-Core, which enforces
 * `user:manage` on every call behind this screen — a Designer who reached this
 * URL would see the page shell and get an error from every action on it.
 */
export default async function UsersPage(): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) redirect('/login?callbackUrl=/dashboard/users')

  let invites: Invite[] = []
  let loadError: string | null = null

  try {
    const token = await getTokenSafe(requestHeaders)
    invites = token?.token ? await listInvites(token.token) : []
  } catch (error) {
    // Most often a Designer landing here: the backend refuses with 403 and we
    // show that plainly rather than pretending the list is empty.
    loadError = error instanceof Error ? error.message : 'Could not load invitations.'
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">People</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          Tensor has no public sign-up. Invite someone by email and they set their own password.
          Links work once and expire after 72 hours.
        </p>
      </div>
      <InviteManager initialInvites={invites} loadError={loadError} />
    </main>
  )
}
