'use client'

import { Settings2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { setDesignPersonalisationRulesForBrand } from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { PersonalisationRules } from '@/lib/validators/designs'

interface DesignPersonalisationDialogProps {
  brand: string
  designId: string
  rules: PersonalisationRules | null
  onSaved: () => void
}

const toList = (s: string): string[] =>
  s
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
const fromList = (a: string[] | undefined): string => (a ?? []).join(', ')

/** Configure what personalization a product offers: allowed fonts/colours/
 * variants, name length, and required fields. Guarded by shopify:publish. */
export function DesignPersonalisationDialog({
  brand,
  designId,
  rules,
  onSaved,
}: DesignPersonalisationDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const [enabled, setEnabled] = useState(false)
  const [nameRequired, setNameRequired] = useState(true)
  const [nameMax, setNameMax] = useState(20)
  const [fonts, setFonts] = useState('')
  const [colours, setColours] = useState('')
  const [variants, setVariants] = useState('')
  const [photoRequired, setPhotoRequired] = useState(false)
  const [approvalRequired, setApprovalRequired] = useState(false)

  function loadFromRules(): void {
    setEnabled(rules?.enabled ?? false)
    setNameRequired(rules?.name.required ?? true)
    setNameMax(rules?.name.max_length || 20)
    setFonts(fromList(rules?.font.allowed))
    setColours(fromList(rules?.colour.allowed))
    setVariants(fromList(rules?.variant.allowed))
    setPhotoRequired(rules?.photo.required ?? false)
    setApprovalRequired(rules?.approval.required ?? false)
  }

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const payload: PersonalisationRules = {
      enabled,
      name: { required: nameRequired, min_length: 0, max_length: nameMax },
      font: { required: false, allowed: toList(fonts) },
      colour: { required: false, allowed: toList(colours) },
      variant: { required: false, allowed: toList(variants) },
      photo: { required: photoRequired },
      approval: { required: approvalRequired },
      zone: null,
    }
    const res = await setDesignPersonalisationRulesForBrand(brand, designId, payload)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the personalisation rules.')
      return
    }
    setOpen(false)
    onSaved()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) {
          setError(null)
          loadFromRules()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Settings2 aria-hidden />
          Personalization
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalization rules</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <span className="font-medium">This product can be personalized</span>
          </label>

          <div
            className={
              enabled ? 'flex flex-col gap-4' : 'pointer-events-none flex flex-col gap-4 opacity-50'
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={nameRequired}
                  onChange={e => setNameRequired(e.target.checked)}
                />
                Name required
              </label>
              <Field label="Max name length" htmlFor="p-namemax">
                <Input
                  id="p-namemax"
                  type="number"
                  min={1}
                  max={200}
                  value={nameMax}
                  onChange={e => setNameMax(Number(e.target.value))}
                />
              </Field>
            </div>

            <Field label="Allowed fonts" htmlFor="p-fonts" hint="Comma-separated; blank = any">
              <Input
                id="p-fonts"
                value={fonts}
                onChange={e => setFonts(e.target.value)}
                placeholder="Poppins, Serif, Mono"
              />
            </Field>
            <Field label="Allowed colours" htmlFor="p-colours" hint="Comma-separated; blank = any">
              <Input
                id="p-colours"
                value={colours}
                onChange={e => setColours(e.target.value)}
                placeholder="White, Black, Gold"
              />
            </Field>
            <Field
              label="Allowed variants"
              htmlFor="p-variants"
              hint="Comma-separated; blank = any"
            >
              <Input
                id="p-variants"
                value={variants}
                onChange={e => setVariants(e.target.value)}
                placeholder="Small, Large"
              />
            </Field>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={photoRequired}
                  onChange={e => setPhotoRequired(e.target.checked)}
                />
                Photo required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={e => setApprovalRequired(e.target.checked)}
                />
                Customer approval required
              </label>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void save()}>
              {pending ? 'Saving…' : 'Save rules'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
