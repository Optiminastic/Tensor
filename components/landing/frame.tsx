import type { ReactNode, JSX } from 'react'

import { Crosshair } from '@/components/landing/crosshair'
import { cn } from '@/lib/utils'

export interface FrameProps {
  children: ReactNode
  className?: string
  /**
   * Mark where the section's top rule crosses the column. Only sections that
   * draw that rule should ask for the marks, or they float against nothing.
   */
  marked?: boolean
}

/**
 * The measured column every section is set against — two vertical rules, inset
 * from the viewport. Sections own their own full-bleed rule and ground; this
 * owns only the column. Keeping the two apart is what lets a band run edge to
 * edge while its contents stay on the grid.
 *
 * Structure comes from these rules rather than from shadows: the flat-elevation
 * half of the Editorial Ink contract.
 */
export function Frame({ children, className, marked = false }: FrameProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className={cn('border-border relative border-x', className)}>
        {marked ? (
          <>
            <Crosshair className="top-0 left-0" />
            <Crosshair className="top-0 right-0 translate-x-1/2" />
          </>
        ) : null}
        {children}
      </div>
    </div>
  )
}
