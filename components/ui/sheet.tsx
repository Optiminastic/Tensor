'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type JSX,
  forwardRef,
} from 'react'

import { cn } from '@/lib/utils'

/**
 * A full-height panel anchored to the right edge - the same Radix dialog the
 * modal Dialog uses (so focus trapping, Escape, scroll locking and the
 * overlay all behave identically), only positioned and sized differently.
 *
 * Use it instead of Dialog when the content is a *record* rather than a
 * decision: a batch's full detail, with a table and a 3D preview, has no
 * business being squeezed into a centred 32rem box.
 */
export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('bg-foreground/40 fixed inset-0 z-50 backdrop-blur-sm', className)}
      {...props}
    />
  )
})

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function SheetContent({ className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // h-dvh, not h-full: on mobile the retracting address bar is part of
          // 100vh, which would hide the bottom of the panel.
          'border-border bg-surface fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-3xl flex-col border-l shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-sm transition-colors focus:outline-none"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

/** The fixed top strip. Stays put while SheetBody scrolls under it. */
export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        'border-border flex shrink-0 flex-col gap-1 border-b px-6 py-4 pr-12',
        className,
      )}
      {...props}
    />
  )
}

/** The scrolling region. min-h-0 is what lets it shrink inside the flex column
 * and actually scroll rather than pushing the panel past the viewport. */
export function SheetBody({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5', className)}
      {...props}
    />
  )
}

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-foreground text-lg font-medium', className)}
      {...props}
    />
  )
})

export const SheetDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
})
