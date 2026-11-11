'use client'

import type { JSX } from 'react'

import { FilamentRowForm } from '@/components/production/filament-row-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Filament } from '@/lib/validators/production'

interface FilamentRowDialogProps {
  brand: string
  /** The row being edited. Omitted to add a new one. */
  filament?: Filament
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Adds a filament row, or edits one - its material and colour included. */
export function FilamentRowDialog({
  brand,
  filament,
  open,
  onOpenChange,
}: FilamentRowDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{filament ? 'Edit filament' : 'Add filament'}</DialogTitle>
        </DialogHeader>
        {/* Keyed so reopening starts from the row's current values. */}
        {open ? (
          <FilamentRowForm
            key={filament?.id ?? 'new'}
            brand={brand}
            filament={filament}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
