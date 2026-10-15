import type { Metadata } from 'next'
import Link from 'next/link'
import type { JSX } from 'react'

import { AuthHeading } from '@/components/auth/auth-heading'
import { AUTH_PANELS } from '@/components/auth/auth-panels'
import { AuthSplit } from '@/components/auth/auth-split'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage(): JSX.Element {
  return (
    <AuthSplit panel={AUTH_PANELS.signIn}>
      <AuthHeading eyebrow="Sign in" title="Welcome back">
        Use your Tensor account to continue.
      </AuthHeading>
      <LoginForm />
      <p className="text-muted-foreground text-xs">
        Access is provisioned by your admin.{' '}
        <Link href="/" className="underline underline-offset-4">
          Back to home
        </Link>
      </p>
    </AuthSplit>
  )
}
