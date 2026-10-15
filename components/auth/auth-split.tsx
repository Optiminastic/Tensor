import type { JSX, ReactNode } from 'react'

import type { AuthPanelCopy } from '@/components/auth/auth-panels'
import { AuthSkyPanel } from '@/components/auth/auth-sky-panel'
import { interTight } from '@/components/landing/landing-font'
import { ThemeSwitch } from '@/components/ui/theme-switch'

interface AuthSplitProps {
  panel: AuthPanelCopy
  children: ReactNode
}

/**
 * The shared shape of every auth page (`/login`, `/admin`, `/accept-invite`):
 * the landing page's sky on the left, the form on the page's own ground on
 * the right, with the theme switch above it. Below
 * `lg` the sky becomes a banner above the form.
 *
 * Inputs inside the form column are taller and rounder than the dashboard's,
 * to match the landing page's pills; the shared Input component is untouched.
 */
export function AuthSplit({ panel, children }: AuthSplitProps): JSX.Element {
  return (
    <main
      className={`${interTight.variable} font-landing text-foreground bg-background grid min-h-dvh gap-3 p-3 lg:grid-cols-2`}
    >
      <AuthSkyPanel copy={panel} />
      <div className="relative flex items-center justify-center px-2 py-10 sm:px-6">
        <ThemeSwitch className="absolute top-2 right-2" />
        <div className="flex w-full max-w-md flex-col gap-8 [&_input]:h-12 [&_input]:rounded-xl [&_input]:px-4">
          {children}
        </div>
      </div>
    </main>
  )
}
