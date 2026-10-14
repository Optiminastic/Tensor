'use client'

import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ChangeEvent, type JSX, useState } from 'react'

import { supplyDesignJobModelAction } from '@/app/dashboard/[brand]/designs/non-dnp/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DesignUploadDialogProps {
  jobId: string
  jobNumber: string
  productName: string
  hasModel: boolean
}

const ACCEPTED = '.stl,.3mf'

/**
 * Where a designer hands over the files for one ordered item.
 *
 * A dialog rather than a bare file input on the row, because this is the one
 * decision on the page and it deserves the middle of the screen: the designer
 * is choosing several files at once and needs to see what they picked before
 * committing.
 *
 * SEVERAL FILES, deliberately. A product a person draws is often more than one
 * model - a body and a clip, a shade and a base - and how many it takes is
 * something the designer discovers while drawing it, not something the shop
 * configured in advance. Each file becomes a job of its own named after it,
 * because a job is the unit a bed is packed from.
 */
export function DesignUploadDialog({
  jobId,
  jobNumber,
  productName,
  hasModel,
}: DesignUploadDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<File[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function choose(event: ChangeEvent<HTMLInputElement>): void {
    setPicked(Array.from(event.target.files ?? []))
    setError(null)
  }

  async function send(): Promise<void> {
    if (picked.length === 0) return
    setPending(true)
    setError(null)

    const form = new FormData()
    for (const file of picked) form.append('files', file)
    const result = await supplyDesignJobModelAction(jobId, form)
    setPending(false)

    if (!result.ok) {
      setError(result.error ?? 'Could not upload the design files.')
      return
    }
    setOpen(false)
    setPicked([])
    // The row leaves the queue once it has a file, so the list is what changes.
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) {
          setPicked([])
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm" onClick={e => e.stopPropagation()}>
          <Upload className="size-3.5" aria-hidden />
          {hasModel ? 'Replace files' : 'Upload'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload the design files</DialogTitle>
          <DialogDescription>
            {productName} · {jobNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="border-border/70 hover:border-foreground/40 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition">
            <Upload className="text-subtle-foreground size-5" aria-hidden />
            <span className="text-sm">Choose one file per piece</span>
            <span className="text-subtle-foreground text-xs">
              .3mf or .stl — a 3MF carries its own colours
            </span>
            <input type="file" accept={ACCEPTED} multiple className="hidden" onChange={choose} />
          </label>

          {picked.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-subtle-foreground text-xs">
                {picked.length === 1
                  ? 'One file — it becomes this job.'
                  : `${picked.length} files — each becomes its own job, named after the file.`}
              </p>
              <ul className="flex flex-col gap-1">
                {picked.map(file => (
                  <li
                    key={file.name}
                    className="bg-surface-muted flex items-center justify-between gap-3 rounded px-2.5 py-1.5 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="text-subtle-foreground font-mono text-xs tabular-nums">
                      {(file.size / 1_000_000).toFixed(1)} MB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void send()}
              disabled={picked.length === 0 || pending}
            >
              {pending
                ? 'Uploading…'
                : picked.length > 1
                  ? `Upload ${picked.length} files`
                  : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
