'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type JSX } from 'react'

import {
  setTemplateSectionAction,
  uploadDesignTemplateAction,
} from '@/app/dashboard/[brand]/production/design-template-actions'
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
import { templateKeyFromFileName } from '@/lib/template-key'

interface DesignAddDialogProps {
  brand: string
  /** Keys already taken. Adding one of these would replace it, not add. */
  existingKeys: string[]
}

/**
 * Adds a design file, filed under its own name.
 *
 * The key is the name the renderer looks up and a variant links to, and it
 * used to be typed into a box beside the file picker. Typing it is the step
 * nobody should have to take: the designer already named the file, and that
 * name is what they will go looking for.
 *
 * The typed field was guarding against something real - a file called
 * "dnp_two_heart (2).scad" becoming a key nobody can type - so the name is
 * NORMALISED rather than trimmed, by templateKeyFromFileName, and the result
 * is SHOWN before the upload. Deriving it out of sight would be the same
 * hazard moved somewhere nobody can see it.
 *
 * Adding a key that already exists is still refused rather than silently
 * uploaded. The endpoint treats a repeat key as a new VERSION of that
 * template - correct for Replace, and wrong for someone who believes they are
 * adding a second design and has just overwritten the first.
 */
export function DesignAddDialog({ brand, existingKeys }: DesignAddDialogProps): JSX.Element {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  // Where it will be filed. '' is automatic: the heading its use implies,
  // which for a file nothing links to yet is Other.
  const [section, setSection] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFile(null)
    setSection('')
    setError(null)
  }, [open])

  const normalised = file === null ? '' : templateKeyFromFileName(file.name)
  const taken = existingKeys.some(k => k.toLowerCase() === normalised)
  // A name with nothing usable in it - "___.scad", or a name that is only
  // punctuation. Rare, and silently uploading it under "" would 422 from the
  // backend with "Name the template", which names nothing the person can act
  // on while looking at this dialog.
  const unusable = file !== null && normalised === ''

  async function save(): Promise<void> {
    if (!file) {
      setError('Choose a .scad file.')
      return
    }
    setError(null)
    setPending(true)
    const form = new FormData()
    form.set('file', file)
    const result = await uploadDesignTemplateAction(brand, normalised, form)
    if (!result.ok) {
      setPending(false)
      setError(result.error ?? 'Could not add the design file.')
      return
    }

    // FILED AFTER THE UPLOAD, and a failure here does not undo it. The file is
    // in - that is the part that took a decision - and a label that did not
    // stick is a dropdown to change, not an upload to do again. Saying so is
    // better than rolling back the thing somebody wanted.
    if (section !== '') {
      const filed = await setTemplateSectionAction(brand, normalised, section)
      if (!filed.ok) {
        setPending(false)
        setError(
          `${normalised} was added, but could not be filed under that section: ${
            filed.error ?? 'the request was refused'
          }. Set it from its row.`,
        )
        router.refresh()
        return
      }
    }

    setPending(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-3.5" aria-hidden />
          Add design file
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add design file</DialogTitle>
          <DialogDescription>
            An OpenSCAD .scad file. It is filed under its own name, which is the key variants link
            to.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="File" htmlFor="t-file" hint={file ? file.name : 'No file chosen'}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="t-file"
                type="file"
                accept=".scad"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={pending}
              >
                Choose .scad
              </Button>
            </div>
          </Field>

          {/* SHOWN, NOT HIDDEN. The key is what a variant links to and what
              somebody types when looking for this file later, so the name it
              is actually getting is on screen before the upload - a derived
              key nobody saw would be the old hazard moved out of sight. */}
          {normalised !== '' ? (
            <p className="text-muted-foreground text-xs">
              Filed as <span className="text-foreground font-mono">{normalised}</span>
            </p>
          ) : null}

          {unusable ? (
            <p className="text-warning text-xs">
              There is nothing in that file&rsquo;s name to make a key from. Rename it to something
              like dnp_three_heart.scad and choose it again.
            </p>
          ) : null}

          {/* Where it lands on this page. Not what it is FOR - that is
              decided by which product links it, on the product. */}
          <Field
            label="Section"
            htmlFor="t-section"
            hint="Where it is filed on this page. It does not decide what the file is used for."
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

          {taken ? (
            <p className="text-warning text-xs">
              A design is already filed as <span className="font-mono">{normalised}</span>. Use
              Replace on its row to upload a new version of it, or rename the file to add it as a
              separate design.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              // normalised is '' both with no file chosen and with a file
              // whose name has nothing usable in it, so it covers both.
              disabled={pending || normalised === '' || taken}
            >
              {pending ? 'Uploading…' : 'Add design file'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
