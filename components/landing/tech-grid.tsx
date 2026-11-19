import { Code2 } from 'lucide-react'
import type { JSX } from 'react'

import type { TechGroup } from '@/components/landing/content/architecture'

interface TechGridProps {
  groups: readonly TechGroup[]
}

/** The tech stack, one column per layer: each tool's mark, name and what it is used for. */
export function TechGrid({ groups }: TechGridProps): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map(group => (
        <section
          key={group.label}
          className="bg-landing-paper flex flex-col gap-4 rounded-[1.5rem] p-6"
        >
          <h3 className="text-landing-ink/60 font-mono text-xs tracking-[0.18em] uppercase">
            {group.label}
          </h3>
          <ul className="flex flex-col gap-4">
            {group.items.map(item => (
              <li key={item.name} className="flex items-start gap-3">
                {item.logo ? (
                  <img
                    src={item.logo.src}
                    alt=""
                    className="mt-0.5 size-6 shrink-0 object-contain"
                  />
                ) : (
                  <span className="bg-landing-lime text-landing-ink mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Code2 className="size-3.5" aria-hidden />
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-landing-ink/70 text-sm">{item.use}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
