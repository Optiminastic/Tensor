'use client'

import { Upload, X } from 'lucide-react'
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

  /**
   * ADDS to the selection; it does not replace it.
   *
   * A designer picks a body, then goes back for the clip - and a file input
   * hands you only the files chosen on THAT trip, so assigning them wholesale
   * threw the first pick away silently. The picker is also reset afterwards,
   * because without it choosing the same file again fires no change event and
   * the dialog looks broken after a removal.
   */
  function choose(event: ChangeEvent<HTMLInputElement>): void {
    const chosen = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (chosen.length === 0) return

    setPicked(current => {
      const next = [...current]
      for (const file of chosen) {
        // Keyed on more than the name: two pieces exported from different
        // folders can share one, and the same file picked twice is a slip
        // rather than two copies of a piece.
        if (next.some(f => sameFile(f, file))) continue
        next.push(file)
      }
      return next
    })
    setError(null)
  }

  function remove(file: File): void {
    setPicked(current => current.filter(f => !sameFile(f, file)))
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
            <span className="text-sm">
              {picked.length === 0 ? 'Choose one file per piece' : 'Add another piece'}
            </span>
            <span className="text-subtle-foreground text-xs">
              {picked.length === 0
                ? '.3mf or .stl — a 3MF carries its own colours'
                : 'Pick several at once, or come back for each one'}
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
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="bg-surface-muted flex items-center gap-3 rounded px-2.5 py-1.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="text-subtle-foreground font-mono text-xs tabular-nums">
                      {(file.size / 1_000_000).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(file)}
                      disabled={pending}
                      aria-label={`Remove ${file.name}`}
                      className="text-subtle-foreground hover:text-danger shrink-0 transition"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
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

/**
 * Whether two picks are the same file.
 *
 * The browser gives a new File object on every visit to the picker, so
 * identity is useless; name, size and modified time together are what
 * distinguishes one piece from another.
 */
function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
}
