import type { JSX } from 'react'

interface FloorFigureProps {
  value: string
  label: string
}

/** One big white number on the sky card. */
export function FloorFigure({ value, label }: FloorFigureProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums sm:text-6xl">{value}</p>
      <p className="text-sm text-white">{label}</p>
    </div>
  )
}
