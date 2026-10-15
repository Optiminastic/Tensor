import { ArrowUpRight } from 'lucide-react'
import type { JSX } from 'react'

/** The black arrow circle a lime pill ends with. */
export function PillArrow(): JSX.Element {
  return (
    <span className="bg-landing-ink grid size-8 place-items-center rounded-full text-white">
      <ArrowUpRight className="size-4" aria-hidden />
    </span>
  )
}
