import type { JSX, ReactNode } from 'react'

interface CardLabelProps {
  children: ReactNode
}

/** The small caption at the top of a carousel card. */
export function CardLabel({ children }: CardLabelProps): JSX.Element {
  return (
    <p className="font-mono text-[0.625rem] tracking-[0.14em] uppercase opacity-70">{children}</p>
  )
}
