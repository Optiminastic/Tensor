import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { PillArrow } from '@/components/landing/pill-arrow'
import { pillClasses, type PillTone } from '@/components/landing/pill-styles'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone: PillTone
  withArrow?: boolean
}

/**
 * A pill-shaped button. See pill-styles.ts for the look. Forwards its ref so a
 * Radix trigger (`DialogTrigger asChild`) can wrap it.
 */
export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(function PillButton(
  { tone, withArrow, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={pillClasses({ tone, withArrow, className })}
      {...props}
    >
      {children}
      {withArrow ? <PillArrow /> : null}
    </button>
  )
})
