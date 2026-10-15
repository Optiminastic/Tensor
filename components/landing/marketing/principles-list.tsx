import type { JSX } from 'react'

import { PRINCIPLES } from '@/lib/marketing/about'

/** The rules Tensor is built around, numbered. */
export function PrinciplesList(): JSX.Element {
  return (
    <section aria-labelledby="principles-title" className="flex flex-col gap-8">
      <h2 id="principles-title" className="font-mono text-xs tracking-[0.2em] uppercase">
        <span aria-hidden className="mr-2">
          •
        </span>
        How it is built
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2">
        {PRINCIPLES.map((principle, index) => (
          <li
            key={principle.title}
            className="bg-landing-paper flex flex-col gap-3 rounded-3xl p-6"
          >
            <span className="text-landing-muted font-mono text-xs tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-2xl font-medium tracking-[-0.03em]">{principle.title}</h3>
            <p className="text-landing-ink/75 text-sm text-pretty">{principle.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
