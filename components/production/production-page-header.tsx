import type { JSX } from 'react'

interface ProductionPageHeaderProps {
  title: string
  description: string
}

export function ProductionPageHeader({
  title,
  description,
}: ProductionPageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-display text-3xl">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
