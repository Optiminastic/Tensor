import type { JSX } from 'react'

import { SignOutButton } from '@/components/dashboard/sign-out-button'

interface UserCardProps {
  email: string
}

/** Who is signed in, and the way out, at the foot of the navigation. */
export function UserCard({ email }: UserCardProps): JSX.Element {
  const initial = email.trim().charAt(0).toUpperCase() || '?'
  return (
    <div className="bg-surface-muted flex flex-col gap-3 rounded-2xl p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="bg-landing-ink text-landing-lime dark:bg-surface dark:ring-border grid size-9 shrink-0 place-items-center rounded-full font-mono text-sm dark:ring-1"
        >
          {initial}
        </span>
        <span className="truncate text-sm" title={email}>
          {email}
        </span>
      </div>
      <SignOutButton />
    </div>
  )
}
