import type { Metadata } from 'next'
import Link from 'next/link'
import type { JSX } from 'react'

import { AUTH_PLATES, AuthSplit } from '@/components/auth/auth-split'
import { LoginForm } from '@/components/auth/login-form'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage(): JSX.Element {
  return (
    <AuthSplit plate={AUTH_PLATES.stone}>
      <Link href="/" className="w-fit">
        <Logo />
      </Link>
      <LoginForm />
      <p className="text-subtle-foreground text-xs">Access is provisioned by your admin.</p>
    </AuthSplit>
  )
}
