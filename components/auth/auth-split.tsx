import type { JSX, ReactNode } from 'react'

import type { AuthPanelCopy } from '@/components/auth/auth-panels'
import { AuthSkyPanel } from '@/components/auth/auth-sky-panel'
import { interTight } from '@/components/landing/landing-font'

interface AuthSplitProps {
  panel: AuthPanelCopy
  children: ReactNode
}

/**
 * The shared shape of every auth page (`/login`, `/admin`, `/accept-invite`):
 * the landing page's sky on the left, the form on white on the right. Below
 * `lg` the sky becomes a banner above the form.
 *
 * Inputs inside the form column are taller and rounder than the dashboard's,
 * to match the landing page's pills; the shared Input component is untouched.
 */
export function AuthSplit({ panel, children }: AuthSplitProps): JSX.Element {
  return (
    <main
      className={`${interTight.variable} font-landing text-landing-ink grid min-h-dvh gap-3 bg-white p-3 lg:grid-cols-2`}
    >
      <AuthSkyPanel copy={panel} />
      <div className="flex items-center justify-center px-2 py-10 sm:px-6">
        <div className="flex w-full max-w-md flex-col gap-8 [&_input]:h-12 [&_input]:rounded-xl [&_input]:px-4">
          {children}
        </div>
      </div>
    </main>
  )
}
