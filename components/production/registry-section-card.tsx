'use client'

import { ChevronRight } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RegistrySectionCardProps {
  title: string
  /** One line, readable while the section is shut. */
  description: string
  count: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}

/**
 * One heading on the Designs tab, as a panel that opens.
 *
 * A CARD RATHER THAN A RULE. The first version of this was a hairline and a
 * chevron, which on a page already made of tables read as a stray divider
 * somebody had left behind - there was nothing to say where one section ended
 * and the next began, and a closed section looked like a heading with its
 * content missing.
 *
 * THE COUNT IS THE POINT OF THE CLOSED STATE. A row of shut panels that say
 * only "Printing files" and "Other" makes somebody open all of them to find
 * what they came for; with the count and one line of description, a shut panel
 * answers the question without being opened.
 *
 * The whole header is the control, not the chevron: a four-pixel target on a
 * screen somebody is using at arm's length on a shop floor is a target they
 * will miss.
 */
export function RegistrySectionCard({
  title,
  description,
  count,
  open,
  onToggle,
  children,
}: RegistrySectionCardProps): JSX.Element {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'hover:bg-surface-muted/60 focus-visible:ring-accent flex w-full items-start gap-3 px-5 py-4 text-left transition-colors focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none',
          open && 'bg-surface-muted/40',
        )}
      >
        <ChevronRight
          className={cn(
            'text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-90',
          )}
          aria-hidden
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-baseline gap-2">
            <span className="text-foreground text-sm font-medium">{title}</span>
            {/* Mono tabular, like every other figure in the product, so a
                column of counts lines up down the page. */}
            <span className="text-muted-foreground font-mono text-xs tabular-nums">{count}</span>
          </span>
          <span className="text-muted-foreground text-sm text-pretty">{description}</span>
        </span>
      </button>
      {open ? <div className="border-border/70 border-t">{children}</div> : null}
    </Card>
  )
}
