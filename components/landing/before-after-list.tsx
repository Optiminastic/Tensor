import { ArrowRight } from 'lucide-react'
import type { JSX } from 'react'

interface BeforeAfterListProps {
  rows: readonly { before: string; after: string }[]
}

/** How the work was done before, struck through, and how Tensor does it now. */
export function BeforeAfterList({ rows }: BeforeAfterListProps): JSX.Element {
  return (
    <ul className="grid gap-3">
      {rows.map(row => (
        <li
          key={row.before}
          className="bg-landing-paper grid items-center gap-3 rounded-[1.25rem] px-5 py-4 text-sm sm:grid-cols-[1fr_auto_1fr]"
        >
          <span className="text-landing-ink/60 line-through decoration-1">{row.before}</span>
          <ArrowRight className="text-landing-ink/50 hidden size-4 sm:block" aria-hidden />
          <span className="font-medium">{row.after}</span>
        </li>
      ))}
    </ul>
  )
}
