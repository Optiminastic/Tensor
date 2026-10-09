import Link from 'next/link'
import type { JSX, ReactNode } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SettingsHeaderProps {
  title: string
  description: string
}

/**
 * The title block each Settings page opens with.
 *
 * Shared so the three pages read as one area. They are separate routes now
 * rather than tabs - the left panel lists them, which is where every other
 * area in Tensor says what it contains - and without a common header they
 * would read as three unrelated screens that happen to share a URL prefix.
 */
export function SettingsHeader({ title, description }: SettingsHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-display text-4xl">{title}</h1>
      <p className="text-muted-foreground max-w-prose text-sm text-pretty">{description}</p>
    </div>
  )
}

interface SettingsNoticeProps {
  tone: 'success' | 'danger'
  children: ReactNode
}

/** The banner an OAuth round-trip lands on. */
export function SettingsNotice({ tone, children }: SettingsNoticeProps): JSX.Element {
  return (
    <p
      role="status"
      className={
        tone === 'success'
          ? 'border-success/40 bg-success/10 text-success rounded-md border px-4 py-3 text-sm'
          : 'border-danger/40 bg-danger/10 text-danger rounded-md border px-4 py-3 text-sm'
      }
    >
      {children}
    </p>
  )
}

interface NoBrandChosenProps {
  what: string
  why: string
}

/** Both brand-scoped pages need a brand; neither can guess which. */
export function NoBrandChosen({ what, why }: NoBrandChosenProps): JSX.Element {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-6">
        <p className="text-sm">
          {what} apply to one brand — {why}.
        </p>
        <p className="text-muted-foreground text-sm">
          Open a brand from the switcher, then come back here.
        </p>
        <Link
          href="/dashboard/brands"
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          Choose a brand
        </Link>
      </CardContent>
    </Card>
  )
}
