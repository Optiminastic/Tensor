import Link from 'next/link'
import type { JSX } from 'react'

import type { AuthPanelCopy } from '@/components/auth/auth-panels'
import { CardConfirm } from '@/components/landing/cards/card-confirm'
import { CardCost } from '@/components/landing/cards/card-cost'
import { CardFleet } from '@/components/landing/cards/card-fleet'
import { SkyBackdrop } from '@/components/landing/sky-backdrop'
import { Logo } from '@/components/logo'

interface AuthSkyPanelProps {
  copy: AuthPanelCopy
}

/**
 * The landing page's sky, beside every auth form: the logo, a two-tone
 * headline and three of Tensor's screens on a small arc. On a phone it shrinks
 * to a banner with no cards, so the width belongs to the form.
 */
export function AuthSkyPanel({ copy }: AuthSkyPanelProps): JSX.Element {
  return (
    <section className="relative isolate flex flex-col overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:min-h-[calc(100dvh-1.5rem)]">
      <SkyBackdrop />
      <Link href="/" aria-label="Tensor - home" className="relative z-10 w-fit rounded-sm">
        <Logo className="text-white" />
      </Link>
      <h2 className="relative z-10 mt-8 text-4xl leading-[1.02] font-medium tracking-[-0.045em] text-white sm:text-5xl lg:mt-auto lg:text-6xl">
        {copy.title}
        <span className="block text-white/70">{copy.highlight}</span>
      </h2>
      <div
        aria-hidden
        className="relative z-10 mt-10 hidden items-end justify-center gap-3 perspective-distant transform-3d lg:mb-auto lg:flex"
      >
        <div className="translate-y-6 scale-90 rotate-y-24">
          <CardCost />
        </div>
        <CardFleet />
        <div className="translate-y-6 scale-90 -rotate-y-24">
          <CardConfirm />
        </div>
      </div>
    </section>
  )
}
