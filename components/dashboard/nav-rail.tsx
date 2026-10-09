'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { JSX } from 'react'

import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

import { primarySegment, visiblePrimarySections, visibleWorkspaceSections } from './nav-config'

interface NavRailProps {
  base: string
  permissions: string[]
}

/**
 * An area tile. Monochrome: the selected one INVERTS.
 *
 * Ink tile, white glyph, against plain ink glyphs on no ground. One tile is
 * filled and nine are not, which is the loudest signal available without
 * spending any colour at all - and colour in this product means state, so
 * spending it on "which area" is spending it twice.
 *
 * --foreground, not black, so dark mode inverts correctly on its own: the
 * selected tile becomes near-white with a dark glyph, which is the same
 * relationship the other way up.
 */
function railClass(active: boolean): string {
  return cn(
    'flex size-10 items-center justify-center rounded-xl transition-colors',
    active ? 'bg-foreground text-background' : 'text-foreground hover:bg-surface-muted',
  )
}

/**
 * Column 1 of the double sidebar: a compact icon rail of the top-level areas.
 * Selecting an area navigates to it; the panel (column 2) then shows its
 * sub-items. Workspace areas sit at the foot.
 */
export function NavRail({ base, permissions }: NavRailProps): JSX.Element {
  const pathname = usePathname()
  const segment = primarySegment(pathname)
  const primary = visiblePrimarySections(permissions)
  const workspace = visibleWorkspaceSections(permissions)

  return (
    <aside className="border-border/70 bg-surface-muted/40 sticky top-0 hidden h-dvh w-[4.25rem] shrink-0 flex-col items-center gap-1 border-r py-4 lg:flex">
      <Link
        href="/dashboard"
        aria-label="Tensor"
        className="mb-3 flex size-10 items-center justify-center"
      >
        <Logo showWordmark={false} markClassName="h-6" />
      </Link>

      {primary.map(section => {
        const Icon = section.icon
        const href = section.segment ? `${base}/${section.segment}` : base
        const active = segment !== null && segment === section.segment
        return (
          <Link
            key={section.label}
            href={href}
            title={section.label}
            aria-label={section.label}
            className={railClass(active)}
          >
            <Icon className="size-5" aria-hidden />
          </Link>
        )
      })}

      <div className="flex-1" />

      {/*
       * A rule between the brand's areas and the workspace ones. They are
       * different KINDS of destination - one is scoped to this brand, the
       * other is not - and without the rule the column reads as one list of
       * ten unrelated icons.
       */}
      {workspace.length > 0 ? <div className="bg-border/80 my-2 h-px w-7" /> : null}

      {workspace.map(section => {
        const Icon = section.icon
        const active = pathname === section.href || pathname.startsWith(`${section.href}/`)
        return (
          <Link
            key={section.label}
            href={section.href}
            title={section.label}
            aria-label={section.label}
            className={railClass(active)}
          >
            <Icon className="size-5" aria-hidden />
          </Link>
        )
      })}
    </aside>
  )
}
