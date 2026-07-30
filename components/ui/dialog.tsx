import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, JSX } from 'react'

import { cn } from '@/lib/utils'

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof RadixDialog.Content>): JSX.Element {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <RadixDialog.Content
        className={cn(
          'border-border bg-surface fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-md">
          <X className="size-4" aria-hidden />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('border-border flex flex-col gap-1 border-b px-5 py-4', className)}
      {...props}
    />
  )
}

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof RadixDialog.Title>): JSX.Element => (
  <RadixDialog.Title
    className={cn('text-foreground text-sm font-semibold tracking-tight', className)}
    {...props}
  />
)

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof RadixDialog.Description>): JSX.Element => (
  <RadixDialog.Description className={cn('text-muted-foreground text-sm', className)} {...props} />
)
