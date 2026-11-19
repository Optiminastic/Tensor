import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface IllustrationProps {
  /** An SVG in public/illustrations; its animation is built into the file. */
  src: string
  alt: string
  /** Sets it on the paper panel, as the diagrams are; bare for a full-width strip. */
  framed?: boolean
}

/** One of the marketing pages' animated illustrations. */
export function Illustration({ src, alt, framed = false }: IllustrationProps): JSX.Element {
  return (
    <div className={cn(framed && 'bg-landing-paper rounded-[2rem] p-4 sm:p-8')}>
      <img src={src} alt={alt} className="h-auto w-full" loading="lazy" />
    </div>
  )
}
