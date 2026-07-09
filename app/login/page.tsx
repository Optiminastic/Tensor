import type { Metadata } from 'next'
import Link from 'next/link'

import { LoginForm } from '@/components/auth/login-form'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto">
          <Logo />
        </Link>
        <LoginForm />
        <p className="text-subtle-foreground text-center text-xs">
          Access is provisioned by your admin.
        </p>
      </div>
    </main>
  )
}
