import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PillTone = 'lime' | 'glass' | 'ink'

interface PillLinkProps {
  href: string
  tone: PillTone
  children: ReactNode
  /** The black arrow circle the lime call to action ends with. */
  withArrow?: boolean
  className?: string
}

const TONES: Record<PillTone, string> = {
  lime: 'bg-landing-lime text-landing-ink hover:bg-landing-lime-deep',
  glass:
    'bg-landing-ink/25 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-landing-ink/40',
  ink: 'bg-landing-ink text-white hover:bg-landing-ink/85',
}

/** The inspiration's pill button: mono, uppercase, widely tracked. */
export function PillLink({
  href,
  tone,
  children,
  withArrow,
  className,
}: PillLinkProps): JSX.Element {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-11 items-center gap-3 rounded-full font-mono text-xs tracking-[0.18em] uppercase transition-colors',
        'focus-visible:ring-landing-lime focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        withArrow ? 'pr-1.5 pl-5' : 'px-5',
        TONES[tone],
        className,
      )}
    >
      {children}
      {withArrow ? (
        <span className="bg-landing-ink grid size-8 place-items-center rounded-full text-white">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      ) : null}
    </Link>
  )
}
