'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

import { assignVariantDesign } from '@/app/dashboard/[brand]/production/registry-actions'
import { useDesignTemplates } from '@/components/production/design-templates-context'
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
import { DESIGN_ROLES, type DesignRole, type RegistryVariant } from '@/lib/validators/registry'

interface VariantDesignDialogProps {
  brand: string
  variant: RegistryVariant
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const UNSET = ''

const ROLE_HINT: Record<DesignRole, string> = {
  body: 'The product itself — the plank.',
  base: 'The light box it sits on. A separate print.',
}

/**
 * Links a variant to one of the design files in the Designs tab.
 *
 * A dropdown over the files that exist, never a typed key. A near-miss like
 * "dnp_2_heart" would be accepted by the backend, resolve to no template, and
 * render nothing - a failure that surfaces as a blank plank at the bed rather
 * than an error here.
 *
 * A variant can need two prints, not one: a with-light plank is the plank and
 * the base box it stands on, separate files on separate beds. That is why this
 * asks which part is being linked rather than assuming one design per variant.
 *
 * The previous design for the role is retired, not deleted, so "which file
 * printed last Tuesday's batch" stays answerable.
 */
export function VariantDesignDialog({
  brand,
  variant,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: VariantDesignDialogProps): JSX.Element {
  const router = useRouter()
  const templates = useDesignTemplates()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [role, setRole] = useState<DesignRole>('body')
  const [key, setKey] = useState(variant.design?.template_key ?? UNSET)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRole('body')
    setKey(variant.design?.template_key ?? UNSET)
    setError(null)
  }, [open, variant])

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await assignVariantDesign(brand, variant.id, {
      role,
      template_key: key,
      design_id: null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not link the design.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link a design to {variant.name}</DialogTitle>
          <DialogDescription>
            Which file prints this variant. Files are managed in the Designs tab.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Part" htmlFor="d-role" hint={ROLE_HINT[role]}>
            <Select id="d-role" value={role} onChange={e => setRole(e.target.value as DesignRole)}>
              {DESIGN_ROLES.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>

          {templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              There are no design files yet. Add one in the Designs tab first.
            </p>
          ) : (
            <Field label="Design file" htmlFor="d-key" hint="From the Designs tab">
              <Select id="d-key" value={key} onChange={e => setKey(e.target.value)}>
                <option value={UNSET}>— choose a file —</option>
                {templates.map(t => (
                  <option key={t.key} value={t.key}>
                    {t.key}
                    {t.source === 'uploaded' ? ` · v${t.version}` : ' · built in'}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={pending || key === UNSET}>
              {pending ? 'Linking…' : 'Link design'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
