import Link from 'next/link'
import type { JSX } from 'react'

import { Card } from '@/components/ui/card'

interface Section {
  index: string
  title: string
  description: string
  href: string
}

const SECTIONS: Section[] = [
  {
    index: '01',
    title: 'Brands',
    description: 'Create brands and edit pricing ladders.',
    href: '/dashboard/brands',
  },
  {
    index: '02',
    title: 'Projects',
    description: 'Group work into projects for a brand.',
    href: '/dashboard/projects',
  },
  {
    index: '03',
    title: 'People',
    description: 'Invite teammates and manage roles.',
    href: '/dashboard/users',
  },
  {
    index: '04',
    title: 'Design system',
    description: 'The Editorial Ink tokens and components.',
    href: '/style-guide',
  },
]

/**
 * The admin work areas, as a numbered index rather than a stock card grid. The
 * links are affordances; Tensor-Core enforces access on every call behind them.
 */
export function SectionNav(): JSX.Element {
  return (
    <Card className="divide-border divide-y overflow-hidden">
      {SECTIONS.map(section => (
        <Link
          key={section.href}
          href={section.href}
          className="hover:bg-surface-muted group flex items-center gap-4 px-5 py-4 transition-colors"
        >
          <span className="text-subtle-foreground font-mono text-xs tabular-nums">
            {section.index}
          </span>
          <span className="flex-1">
            <span className="text-foreground block text-sm font-medium">{section.title}</span>
            <span className="text-muted-foreground block text-xs">{section.description}</span>
          </span>
          <span
            aria-hidden
            className="text-subtle-foreground group-hover:text-accent transition-colors"
          >
            &rarr;
          </span>
        </Link>
      ))}
    </Card>
  )
}
