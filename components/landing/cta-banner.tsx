import type { JSX } from 'react'

import { PillLink } from '@/components/landing/pill-link'

interface CtaBannerProps {
  title: string
  body: string
  links: readonly { href: string; label: string }[]
}

/** An ink banner closing a page, with the next places to go. The last link is the lime one. */
export function CtaBanner({ title, body, links }: CtaBannerProps): JSX.Element {
  return (
    <section className="bg-landing-ink flex flex-col items-start gap-5 rounded-[1.75rem] px-6 py-10 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium tracking-[-0.03em]">{title}</h2>
        <p className="text-sm text-white/75">{body}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {links.map((link, i) => {
          const last = i === links.length - 1
          return (
            <PillLink
              key={link.href}
              href={link.href}
              tone={last ? 'lime' : 'glass'}
              withArrow={last}
            >
              {link.label}
            </PillLink>
          )
        })}
      </div>
    </section>
  )
}
