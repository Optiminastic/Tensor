'use client'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react'

import { cn } from '@/lib/utils'

// A menu hung off a control, for the actions a row can take.
//
// Styled to match popover.tsx rather than inventing a second surface: both are
// a bordered panel floating over the page, and having them disagree about
// radius or shadow is the kind of drift nobody notices until the two appear
// side by side.

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, align = 'end', sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'border-border bg-surface z-50 min-w-44 rounded-lg border p-1 shadow-md outline-none',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(function DropdownMenuItem({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
        'focus:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  )
})

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
})
