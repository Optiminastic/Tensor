'use client'

import { useState, type JSX } from 'react'

import { type BrandChoice, DesignUploadForm } from '@/components/designs/design-upload-form'
import { PillButton } from '@/components/landing/pill-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UploadDesignDialogProps {
  brand: string
  // Present in the global "all brands" view, so the form can ask which brand to
  // create the design under. Absent in a single-brand context.
  brandOptions?: BrandChoice[]
}

/** Opens the design upload form in a dialog, keeping the designs page uncluttered. */
export function UploadDesignDialog({ brand, brandOptions }: UploadDesignDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PillButton tone="lime" withArrow>
          Upload design
        </PillButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-3xl sm:p-8">
        <div className="mb-2 flex flex-col gap-2">
          <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
            <span aria-hidden className="mr-2">
              •
            </span>
            New design
          </p>
          <DialogTitle className="text-3xl font-medium tracking-[-0.04em]">
            Upload a design
          </DialogTitle>
          <DialogDescription>
            Tensor slices it, costs it from the slicer and suggests a price off the ladder.
          </DialogDescription>
        </div>
        {/* The form navigates to the new design on success; closing here covers cancel. */}
        <DesignUploadForm brand={brand} brandOptions={brandOptions} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
