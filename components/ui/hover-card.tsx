'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export const HoverCard = HoverCardPrimitive.Root
export const HoverCardTrigger = HoverCardPrimitive.Trigger

export const HoverCardContent = forwardRef<
  ElementRef<typeof HoverCardPrimitive.Content>,
  ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(function HoverCardContent({ className, align = 'start', sideOffset = 8, ...props }, ref) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        // Portalled and z-50, matching PopoverContent: a card opened from the
        // last row of a table must escape the table's overflow rather than be
        // clipped by it.
        className={cn(
          'border-border bg-surface z-50 rounded-lg border p-3 shadow-md outline-none',
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
})
