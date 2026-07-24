import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { FirstAdminForm } from '@/components/admin/first-admin-form'
import { AUTH_PLATES, AuthSplit } from '@/components/auth/auth-split'
import { adminExists } from '@/services/admin.service'

export const metadata: Metadata = { title: 'Set up Tensor' }

// The answer changes the moment the first admin is created, so this page must
// never be cached or prerendered.
export const dynamic = 'force-dynamic'

/**
 * The one place an admin is born.
 *
 * Tensor has no public sign-up. This page shows a sign-up form only while
 * Tensor has no admin at all; once one exists it becomes a redirect to /login,
 * forever. Everyone after the first admin arrives by invitation.
 *
 * This check is a UI convenience, not the security boundary. Tensor-Core's
 * bootstrap endpoint refuses once any admin exists, so even a request that
 * slipped past this page cannot mint a second admin.
 */
export default async function AdminSetupPage(): Promise<JSX.Element> {
  let exists: boolean
  try {
    exists = await adminExists()
  } catch {
    // If the backend is unreachable we cannot know whether an admin exists.
    // Showing the form would be the unsafe guess, so refuse instead.
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-12">
        <h1 className="text-display text-3xl">Tensor is not reachable</h1>
        <p className="text-muted-foreground text-sm">
          Tensor-Core is not responding, so setup cannot continue. Start the backend and reload.
        </p>
      </main>
    )
  }

  if (exists) redirect('/login')

  return (
    <AuthSplit plate={AUTH_PLATES.pawn}>
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Set up Tensor</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Tensor has no admin yet. Create the first one. Everyone after this is invited from the
          dashboard — there is no public sign-up.
        </p>
      </div>
      <FirstAdminForm />
    </AuthSplit>
  )
}
