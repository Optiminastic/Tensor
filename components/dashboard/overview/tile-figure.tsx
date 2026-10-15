import type { JSX } from 'react'

interface TileFigureProps {
  label: string
  value: string
  hint?: string
}

/** One figure in a tile: a small label, the number, and an optional quiet hint. */
export function TileFigure({ label, value, hint }: TileFigureProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs opacity-70">{label}</span>
      <span className="text-2xl font-medium tracking-tight tabular-nums">{value}</span>
      {hint ? <span className="text-xs tabular-nums opacity-70">{hint}</span> : null}
    </div>
  )
}
