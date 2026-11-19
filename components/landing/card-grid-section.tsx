import type { JSX } from 'react'

import { ContentSection } from '@/components/landing/content-section'
import { InfoCard, type InfoCardProps } from '@/components/landing/info-card'
import { cn } from '@/lib/utils'

interface CardGridSectionProps {
  id?: string
  eyebrow: string
  title: string
  intro?: string
  cards: readonly InfoCardProps[]
  /** Two columns for long cards, three for short ones. */
  columns?: 2 | 3
}

/** A section whose content is a grid of cards: features, integrations, roles, algorithms. */
export function CardGridSection({
  id,
  eyebrow,
  title,
  intro,
  cards,
  columns = 3,
}: CardGridSectionProps): JSX.Element {
  return (
    <ContentSection id={id} eyebrow={eyebrow} title={title} intro={intro}>
      <div className={cn('grid gap-4 md:grid-cols-2', columns === 3 && 'lg:grid-cols-3')}>
        {cards.map(card => (
          <InfoCard key={card.title} {...card} />
        ))}
      </div>
    </ContentSection>
  )
}
