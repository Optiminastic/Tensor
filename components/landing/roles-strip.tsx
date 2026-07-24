import type { JSX } from 'react'

import { Eyebrow } from '@/components/landing/eyebrow'
import { Frame } from '@/components/landing/frame'

/** The RBAC roles the backend actually enforces — not a logo wall. */
const ROLES = ['Designer', 'Project Lead', 'Operator', 'Performance Marketer', 'Admin']

/**
 * Where an outward-facing site would put customer logos, an internal tool puts
 * the people it answers to. Every name here maps to a role the API enforces, so
 * the strip stays true as the RBAC surface grows.
 */
export function RolesStrip(): JSX.Element {
  return (
    <section aria-label="Who Tensor is for" className="border-border border-t">
      <Frame marked className="px-6 py-5 sm:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <Eyebrow>Built for the roles in the loop:</Eyebrow>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {ROLES.map(role => (
              <li key={role} className="text-muted-foreground text-xs font-medium">
                {role}
              </li>
            ))}
          </ul>
        </div>
      </Frame>
    </section>
  )
}
