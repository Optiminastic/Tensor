import type { JSX } from 'react'

interface SpecChipsProps {
  specs: string[]
  label: string
}

/** A row of quiet rounded chips; empty entries are skipped. */
export function SpecChips({ specs, label }: SpecChipsProps): JSX.Element {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {specs.filter(Boolean).map(spec => (
        <li
          key={spec}
          className="bg-surface-muted text-muted-foreground rounded-full px-3 py-1 text-sm tabular-nums"
        >
          {spec}
        </li>
      ))}
    </ul>
  )
}
