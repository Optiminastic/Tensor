'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type JSX } from 'react'

import {
  setTemplateSectionAction,
  uploadDesignTemplateAction,
} from '@/app/dashboard/[brand]/production/design-template-actions'
import {
  DesignAddFileList,
  type DesignUploadOutcome,
} from '@/components/production/design-add-file-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { planDesignUploads, type DesignUploadCandidate } from '@/lib/design-upload-plan'

interface DesignAddDialogProps {
  brand: string
  /** Keys already taken. Adding one of these would replace it, not add. */
  existingKeys: string[]
}

/**
 * Adds design files, each filed under its own name.
 *
 * TWO THINGS THIS USED TO ASK FOR AND NO LONGER DOES.
 *
 * The key was typed into a box beside the picker. The designer had already
 * named the file, and that name is what they will go looking for, so it now
 * comes from the file - normalised by templateKeyFromFileName, because the
 * typed box was guarding against something real ("dnp_two_heart (2).scad")
 * and dropping the box must not drop the guard. The derived key is SHOWN
 * before the upload; deriving it out of sight would be the same hazard moved
 * somewhere nobody can see it.
 *
 * And it took one file. A product arrives as a FOLDER of .scad files - the
 * Diwali holder is three colourways, the Soulmate combo three parts - and
 * filing them one dialog at a time, retyping a key each time, is the manual
 * effort this removes. The whole batch goes under one section.
 *
 * A BATCH MAKES ITS OWN MISTAKES POSSIBLE, so planDesignUploads judges every
 * file before any of them is sent, and the list says what will happen to
 * each. A key that already exists is still held back rather than silently
 * uploaded: the endpoint treats a repeat key as a new VERSION, which is
 * correct for Replace and wrong for someone who believes they are adding a
 * second design and has just overwritten the first.
 */
export function DesignAddDialog({ brand, existingKeys }: DesignAddDialogProps): JSX.Element {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  // Where they will be filed. '' is automatic: the heading their use implies,
  // which for a file nothing links to yet is Other.
  const [section, setSection] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(0)
  const [outcomes, setOutcomes] = useState<Map<string, DesignUploadOutcome> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFiles([])
    setSection('')
    setOutcomes(null)
    setDone(0)
    setError(null)
  }, [open])

  const plan = planDesignUploads(files, existingKeys)

  function choose(chosen: FileList | null): void {
    if (chosen === null) return
    setOutcomes(null)
    setError(null)
    // ADDED TO WHAT IS THERE, not replacing it. Picking twice is how somebody
    // collects files from two folders, and a second pick that wiped the first
    // would be a silent loss of work they have already done.
    setFiles(current => {
      const names = new Set(current.map(f => f.name))
      return [...current, ...Array.from(chosen).filter(f => !names.has(f.name))]
    })
  }

  async function save(): Promise<void> {
    if (plan.ready.length === 0) return
    setError(null)
    setPending(true)
    setDone(0)

    const results = new Map<string, DesignUploadOutcome>()
    // ONE AT A TIME. Each is an upload of a file plus a second call to file
    // it, and firing nine of those at once buys a second of wall clock for a
    // much worse failure: a batch half-applied with no order to it, which
    // nobody can read back off the table.
    for (const candidate of plan.ready) {
      results.set(candidate.key, await upload(brand, candidate, section))
      setDone(n => n + 1)
      setOutcomes(new Map(results))
    }

    setPending(false)
    // The files that went in stay in, whatever happened to the rest, so the
    // page is refreshed either way.
    router.refresh()

    const failed = [...results.values()].filter(r => !r.ok)
    if (failed.length === 0 && plan.skipped.length === 0) {
      setOpen(false)
      return
    }
    // Left open on anything less than a clean run, because the list IS the
    // explanation and closing over it would leave somebody to work out from
    // the table which of nine files are missing.
    if (failed.length > 0) {
      setError(`${failed.length} of ${plan.ready.length} could not be added. The rest are in.`)
    }
  }

  const label = pending
    ? `Uploading ${done + 1} of ${plan.ready.length}…`
    : addLabel(plan.ready.length)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-3.5" aria-hidden />
          Add design files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add design files</DialogTitle>
          <DialogDescription>
            OpenSCAD .scad files. Each is filed under its own name, which is the key variants link
            to, and all of them under the section you choose.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field
            label="Files"
            htmlFor="t-file"
            hint={
              files.length === 0
                ? 'No files chosen — pick as many as you like'
                : `${files.length} chosen, ${plan.ready.length} will be added`
            }
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="t-file"
                type="file"
                accept=".scad"
                multiple
                className="hidden"
                onChange={e => {
                  choose(e.target.files)
                  // Cleared so choosing the SAME file again still fires a
                  // change event, which is what happens after a removal.
                  e.target.value = ''
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={pending}
              >
                Choose .scad files
              </Button>
              {files.length > 0 && !pending ? (
                <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                  Clear
                </Button>
              ) : null}
            </div>
          </Field>

          <DesignAddFileList
            candidates={plan.candidates}
            outcomes={outcomes}
            disabled={pending}
            onRemove={name => setFiles(current => current.filter(f => f.name !== name))}
          />

          {/* Where they land on this page. Not what they are FOR - that is
              decided by which product links them, on the product. */}
          <Field
            label="Section"
            htmlFor="t-section"
            hint="Where they are filed on this page. It does not decide what the files are used for."
          >
            <Select
              id="t-section"
              value={section}
              disabled={pending}
              onChange={e => setSection(e.target.value)}
            >
              <option value="">Automatic — by what links to it</option>
              <option value="print">Printing files</option>
              <option value="preview">Personalisation preview</option>
              <option value="other">Other</option>
            </Select>
          </Field>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              {outcomes === null ? 'Cancel' : 'Close'}
            </Button>
            <Button onClick={() => void save()} disabled={pending || plan.ready.length === 0}>
              {label}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Uploads one file and files it under the section.
 *
 * FILED AFTER THE UPLOAD, and a failure there does not undo it. The file is
 * in - that is the part that took a decision - and a label that did not stick
 * is a dropdown to change, not an upload to do again.
 */
async function upload(
  brand: string,
  candidate: DesignUploadCandidate,
  section: string,
): Promise<DesignUploadOutcome> {
  const form = new FormData()
  form.set('file', candidate.file)

  const added = await uploadDesignTemplateAction(brand, candidate.key, form)
  if (!added.ok) {
    return { key: candidate.key, ok: false, error: added.error ?? 'could not be added' }
  }
  if (section === '') return { key: candidate.key, ok: true }

  const filed = await setTemplateSectionAction(brand, candidate.key, section)
  if (!filed.ok) {
    return {
      key: candidate.key,
      ok: true,
      error: `added, but not filed under that section — set it from its row`,
    }
  }
  return { key: candidate.key, ok: true }
}

function addLabel(count: number): string {
  if (count === 0) return 'Add design files'
  if (count === 1) return 'Add 1 design file'
  return `Add ${count} design files`
}
