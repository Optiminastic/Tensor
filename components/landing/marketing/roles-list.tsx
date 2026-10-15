import type { JSX } from 'react'

import { ROLES } from '@/lib/marketing/about'

/** Who uses Tensor, each role with what it does there. */
export function RolesList(): JSX.Element {
  return (
    <section aria-labelledby="roles-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 id="roles-title" className="font-mono text-xs tracking-[0.2em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          Who uses it
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
          Each person sees the areas their role needs. What a role may do is enforced by the
          backend, not only hidden on the screen.
        </p>
      </div>
      <ul className="bg-landing-ink dark:ring-border grid gap-px overflow-hidden rounded-3xl text-white sm:grid-cols-2 lg:grid-cols-5 dark:ring-1">
        {ROLES.map(role => (
          <li key={role.name} className="bg-landing-ink flex flex-col gap-2 p-6">
            <h3 className="text-lg font-medium tracking-tight">{role.name}</h3>
            <p className="text-sm text-pretty text-white/75">{role.does}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
