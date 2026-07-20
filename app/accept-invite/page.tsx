import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AcceptInviteForm } from '@/components/admin/accept-invite-form'
import { AUTH_PLATES, AuthSplit } from '@/components/auth/auth-split'
import { checkInvite } from '@/services/admin.service'

export const metadata: Metadata = { title: 'Accept your invitation' }

export const dynamic = 'force-dynamic'

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>
}

/**
 * Where an invited person sets their own password.
 *
 * The token is validated server-side before anything renders, so a dead link
 * never shows a form that cannot work. It reveals only the email and role the
 * invite was issued for — enough to show who it is for, nothing more.
 */
export default async function AcceptInvitePage(props: AcceptInvitePageProps): Promise<JSX.Element> {
  const searchParams = await props.searchParams
  const token = searchParams.token

  if (!token) return <InviteProblem message="This link is missing its invitation code." />

  let invite: { email: string; role: string }
  try {
    invite = await checkInvite(token)
  } catch (error) {
    // The backend gives the same message for expired, already-used and
    // never-existed, on purpose — telling them apart would confirm to a
    // stranger which tokens are real.
    return (
      <InviteProblem
        message={error instanceof Error ? error.message : 'This invitation is no longer valid.'}
      />
    )
  }

  return (
    <AuthSplit plate={AUTH_PLATES.stone}>
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Welcome to Tensor</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          You have been invited as{' '}
          <span className="text-foreground font-medium">{invite.role.replace(/_/g, ' ')}</span>.
          Choose a password — nobody else knows it, and nobody set one for you.
        </p>
      </div>
      <AcceptInviteForm token={token} email={invite.email} />
    </AuthSplit>
  )
}

function InviteProblem({ message }: { message: string }): JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-display text-3xl">Invitation not valid</h1>
      <p className="text-muted-foreground text-sm text-pretty">{message}</p>
      <p className="text-subtle-foreground text-sm">
        Ask an admin to send you a new one. Invitations expire after 72 hours and work only once.
      </p>
    </main>
  )
}
