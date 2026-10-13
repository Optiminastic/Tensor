import type { ButtonHTMLAttributes, JSX } from 'react'

import { PillArrow } from '@/components/landing/pill-arrow'
import { pillClasses, type PillTone } from '@/components/landing/pill-styles'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone: PillTone
  withArrow?: boolean
}

/** A pill-shaped button: the auth forms' submit. See pill-styles.ts for the look. */
export function PillButton({
  tone,
  withArrow,
  className,
  children,
  type = 'button',
  ...props
}: PillButtonProps): JSX.Element {
  return (
    <button type={type} className={pillClasses({ tone, withArrow, className })} {...props}>
      {children}
      {withArrow ? <PillArrow /> : null}
    </button>
  )
}
