'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState, type JSX } from 'react'

import { MACHINE_IMAGE_SRC } from '@/components/production/sample-data'
import { MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { MachineSummary } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MachinesPanelProps {
  machines: MachineSummary[]
}

interface CarouselArrowProps {
  direction: 'prev' | 'next'
  onClick: () => void
}

function CarouselArrow({ direction, onClick }: CarouselArrowProps): JSX.Element {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous machine' : 'Next machine'}
      className={cn(
        'bg-surface/90 text-muted-foreground hover:text-foreground absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full shadow-xs backdrop-blur-sm transition-colors',
        direction === 'prev' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  )
}

export function MachinesPanel({ machines }: MachinesPanelProps): JSX.Element {
  const [index, setIndex] = useState(0)
  const machine = machines[index]
  const status = MACHINE_STATUS_CONFIG[machine.status]

  const goPrev = (): void => setIndex(i => (i - 1 + machines.length) % machines.length)
  const goNext = (): void => setIndex(i => (i + 1) % machines.length)

  return (
    <Card className="relative aspect-square overflow-hidden">
      <TonePill label={status.label} tone={status.tone} className="absolute top-3 left-3 z-10" />
      {machines.length > 1 ? (
        <>
          <CarouselArrow direction="prev" onClick={goPrev} />
          <CarouselArrow direction="next" onClick={goNext} />
        </>
      ) : null}
      <Image
        src={MACHINE_IMAGE_SRC}
        alt={`${machine.name} printer`}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover"
      />
      {machines.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {machines.map((m, i) => (
            <span
              key={m.id}
              className={cn('size-1.5 rounded-full', i === index ? 'bg-accent' : 'bg-surface/70')}
            />
          ))}
        </div>
      ) : null}
    </Card>
  )
}
