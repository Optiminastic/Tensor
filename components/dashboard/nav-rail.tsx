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

function railClass(active: boolean): string {
  return cn(
    'flex size-10 items-center justify-center rounded-md transition-colors',
    active
      ? 'bg-accent-subtle text-foreground'
      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
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
    <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center gap-1 border-r py-3 lg:flex">
      <Link
        href="/dashboard"
        aria-label="Tensor"
        className="mb-2 flex size-10 items-center justify-center"
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
