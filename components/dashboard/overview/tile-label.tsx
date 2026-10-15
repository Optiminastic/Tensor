import type { JSX, ReactNode } from 'react'

interface TileLabelProps {
  children: ReactNode
}

/** The small mono label at the top of a tile. */
export function TileLabel({ children }: TileLabelProps): JSX.Element {
  return <h2 className="font-mono text-xs tracking-[0.16em] uppercase opacity-80">{children}</h2>
}
