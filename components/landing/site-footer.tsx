import Link from 'next/link'
import type { JSX } from 'react'

import { Frame } from '@/components/landing/frame'
import { Logo } from '@/components/logo'

export function SiteFooter(): JSX.Element {
  return (
    <footer className="border-border border-t">
      <Frame marked className="px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="text-subtle-foreground flex items-center gap-6 text-xs">
            <Link href="/style-guide" className="hover:text-foreground transition-colors">
              Design system
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <span>Optiminastic</span>
          </div>
        </div>
      </Frame>
    </footer>
  )
}
