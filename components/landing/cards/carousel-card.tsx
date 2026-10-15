import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type CardTone = 'paper' | 'ink' | 'sky'

interface CarouselCardProps {
  tone?: CardTone
  children: ReactNode
  className?: string
}

const TONES: Record<CardTone, string> = {
  paper: 'bg-white text-landing-ink',
  ink: 'bg-landing-ink text-white',
  sky: 'bg-landing-sky-deep/85 text-white ring-1 ring-white/30 backdrop-blur-md',
}

/** One miniature Tensor screen standing on the print-bed arc. */
export function CarouselCard({
  tone = 'paper',
  children,
  className,
}: CarouselCardProps): JSX.Element {
  return (
    <div
      className={cn(
        'shadow-landing-sky-deep/25 flex h-52 w-40 flex-col gap-2 overflow-hidden rounded-2xl p-3.5 shadow-xl',
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  )
}
