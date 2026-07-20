import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { SignOutButton } from '@/components/dashboard/sign-out-button'
import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'
import { auth } from '@/lib/auth'

export const metadata: Metadata = { title: 'Dashboard' }

// The session decides what renders, so this can never be prerendered.
export const dynamic = 'force-dynamic'

/**
 * The signed-in landing.
 *
 * A returning user needs one clear place that says "you are in" and points at
 * what they can do — otherwise login drops them back on the marketing page and
 * looks like it failed. The links here are affordances, not permissions: the
 * People area is admin-only, and Tensor-Core enforces that on every call behind
 * it. A non-admin who clicks through sees the backend refuse, not this page.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() })
  // UX guard, mirrored by middleware. Real authorization lives in the backend.
  if (!session) redirect('/login?callbackUrl=/dashboard')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <SignOutButton />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Signed in</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          You are signed in as{' '}
          <span className="text-foreground font-medium">{session.user.email}</span>.
        </p>
      </div>

      <nav aria-label="Dashboard" className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/users"
          className="border-border bg-surface hover:border-border-strong flex flex-col gap-1 rounded-lg border p-4 transition-colors"
        >
          <span className="text-foreground text-sm font-medium">People</span>
          <span className="text-muted-foreground text-xs">
            Invite teammates and manage roles. Admin only.
          </span>
        </Link>
        <Link
          href="/dashboard/projects"
          className="border-border bg-surface hover:border-border-strong flex flex-col gap-1 rounded-lg border p-4 transition-colors"
        >
          <span className="text-foreground text-sm font-medium">Projects</span>
          <span className="text-muted-foreground text-xs">
            Group work into projects for a brand. Admin only.
          </span>
        </Link>
        <Link
          href="/dashboard/brands"
          className="border-border bg-surface hover:border-border-strong flex flex-col gap-1 rounded-lg border p-4 transition-colors"
        >
          <span className="text-foreground text-sm font-medium">Brands</span>
          <span className="text-muted-foreground text-xs">
            Edit pricing ladders and CP thresholds. Admin only.
          </span>
        </Link>
        <Link
          href="/style-guide"
          className="border-border bg-surface hover:border-border-strong flex flex-col gap-1 rounded-lg border p-4 transition-colors"
        >
          <span className="text-foreground text-sm font-medium">Design system</span>
          <span className="text-muted-foreground text-xs">
            The Editorial Ink tokens and components.
          </span>
        </Link>
      </nav>

      <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' w-fit'}>
        ← Back to site
      </Link>
    </main>
  )
}
