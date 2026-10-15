import Link from 'next/link'
import type { JSX, ReactNode } from 'react'

import { PillArrow } from '@/components/landing/pill-arrow'
import { pillClasses, type PillTone } from '@/components/landing/pill-styles'

interface PillLinkProps {
  href: string
  tone: PillTone
  children: ReactNode
  withArrow?: boolean
  className?: string
}

/** A pill-shaped link. See pill-styles.ts for the look. */
export function PillLink({
  href,
  tone,
  children,
  withArrow,
  className,
}: PillLinkProps): JSX.Element {
  return (
    <Link href={href} className={pillClasses({ tone, withArrow, className })}>
      {children}
      {withArrow ? <PillArrow /> : null}
    </Link>
  )
}
