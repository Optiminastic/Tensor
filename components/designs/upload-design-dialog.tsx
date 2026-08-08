'use client'

import { Plus } from 'lucide-react'
import { useState, type JSX } from 'react'

import { DesignUploadForm } from '@/components/designs/design-upload-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UploadDesignDialogProps {
  brand: string
}

/** Opens the design upload form in a dialog, keeping the designs page uncluttered. */
export function UploadDesignDialog({ brand }: UploadDesignDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          Upload design
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a design</DialogTitle>
        </DialogHeader>
        {/* The form navigates to the new design on success; closing here covers cancel. */}
        <DesignUploadForm brand={brand} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
