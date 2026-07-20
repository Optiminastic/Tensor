'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { JSX } from 'react'

import { Button } from '@/components/ui/button'
import { signOutCurrentUser } from '@/services/auth.service'

/**
 * Ends the session and returns to /login.
 *
 * A leaf client component so the dashboard page can stay a server component;
 * sign-out is the one action here that needs the browser.
 */
export function SignOutButton(): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function onSignOut(): Promise<void> {
    setPending(true)
    await signOutCurrentUser()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="secondary" size="sm" onClick={onSignOut} disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
