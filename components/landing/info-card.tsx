import type { LucideIcon } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

/** A logo file under public/logos, with the name it stands for. */
export interface CardLogo {
  src: string
  alt: string
  /** A wordmark (wider than tall) rather than a square mark. */
  wide?: boolean
}

export interface InfoCardProps {
  title: string
  description: string
  /** The specifics, one line each. */
  points?: readonly string[]
  /** A real logo, or a line icon where the thing has none. */
  logo?: CardLogo
  icon?: LucideIcon
  /** A short mono label beside the title, e.g. "Orders" or "Worker". */
  tag?: string
}

/**
 * One feature, integration or technology: its mark, what it is, and the
 * specifics as a short list. Paper on white with a hairline edge - the landing
 * UI's card - so a grid of them reads calm and even.
 */
export function InfoCard({
  title,
  description,
  points,
  logo,
  icon: Icon,
  tag,
}: InfoCardProps): JSX.Element {
  return (
    <article className="bg-landing-paper flex flex-col gap-4 rounded-[1.5rem] p-6">
      <div className="flex items-start justify-between gap-3">
        {logo ? (
          // A plain <img>: the logos are tiny static files, and the landing
          // pages already serve images unoptimised.
          <img
            src={logo.src}
            alt={logo.alt}
            className={cn('object-contain', logo.wide ? 'h-7 w-auto max-w-[9rem]' : 'size-9')}
          />
        ) : Icon ? (
          <span className="bg-landing-lime text-landing-ink flex size-9 items-center justify-center rounded-full">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        {tag ? (
          <span className="text-landing-ink/60 font-mono text-[0.7rem] tracking-[0.16em] uppercase">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium tracking-[-0.02em]">{title}</h3>
        <p className="text-landing-ink/70 text-sm text-pretty">{description}</p>
      </div>
      {points && points.length > 0 ? (
        <ul className="text-landing-ink/80 flex flex-col gap-1.5 text-sm">
          {points.map(point => (
            <li key={point} className="flex gap-2">
              <span aria-hidden className="bg-landing-ink/40 mt-2 size-1 shrink-0 rounded-full" />
              <span className="text-pretty">{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
