import type { JSX } from 'react'

const ROLES = ['DE', 'PL', 'OP', 'QC', 'AD']

/** The roles that share one answer, as overlapping initials. */
export function RoleChips(): JSX.Element {
  return (
    <div aria-label="Designer, Project Lead, Operator, QC and Admin" className="flex">
      {ROLES.map((r, i) => (
        <span
          key={r}
          className={`border-landing-paper bg-landing-ink grid size-9 place-items-center rounded-full border-2 font-mono text-[0.625rem] text-white ${i > 0 ? '-ml-2.5' : ''}`}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
