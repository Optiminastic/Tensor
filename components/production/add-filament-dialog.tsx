'use client'

import { Plus } from 'lucide-react'
import { useState, type JSX } from 'react'

import { AddFilamentForm } from '@/components/production/add-filament-form'
import type { FilamentRecord } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface AddFilamentDialogProps {
  onAdd: (filament: FilamentRecord) => void
}

export function AddFilamentDialog({ onAdd }: AddFilamentDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)

  function handleAdd(filament: FilamentRecord): void {
    onAdd(filament)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="primary" size="sm">
          <Plus className="size-3.5" aria-hidden />
          Add Filament
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add filament</DialogTitle>
        </DialogHeader>
        <AddFilamentForm onAdd={handleAdd} />
      </DialogContent>
    </Dialog>
  )
}
