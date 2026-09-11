'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

import { addVariant, editVariant } from '@/app/dashboard/[brand]/production/registry-actions'
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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  PRODUCT_STATUSES,
  type ProductOption,
  type ProductStatus,
  type RegistryVariant,
} from '@/lib/validators/registry'

interface VariantFormDialogProps {
  brand: string
  productCode: string
  options: ProductOption[]
  /** The variant being edited. Omitted to create one. */
  variant?: RegistryVariant
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const UNSET = ''

/**
 * Parses "heart_count=2,light=wired" back into a choice per axis.
 *
 * The variant's option values arrive as that string rather than as ids, because
 * that is what a variant IS and what the table shows. Turning it back into
 * selections needs the option list to map code to id - which is why this takes
 * both.
 */
function selectionsFrom(variant: RegistryVariant | undefined, options: ProductOption[]) {
  const chosen: Record<string, string> = {}
  for (const option of options) chosen[option.id] = UNSET
  if (!variant?.options) return chosen

  for (const pair of variant.options.split(',')) {
    const [optionCode, valueCode] = pair.split('=')
    const option = options.find(o => o.code === optionCode?.trim())
    const value = option?.values.find(v => v.code === valueCode?.trim())
    if (option && value) chosen[option.id] = value.id
  }
  return chosen
}

/**
 * One sellable combination: a value on each axis, plus the SKU that sells it.
 *
 * The axes are selects rather than free text because a variant is a COMBINATION
 * of option values, not a row of columns somebody types. Free text here is how
 * you get "2 hearts", "2 Hearts" and "two hearts" as three variants of the same
 * thing, none of which resolve.
 *
 * SKU may be left blank. Nine live plank lines carry none and are matched by
 * product name instead - a registry that assumed Shopify was tidy would have
 * nowhere to put them.
 */
export function VariantFormDialog({
  brand,
  productCode,
  options,
  variant,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: VariantFormDialogProps): JSX.Element {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [name, setName] = useState(variant?.name ?? '')
  const [sku, setSku] = useState(variant?.sku ?? '')
  const [status, setStatus] = useState<ProductStatus>(
    (variant?.status as ProductStatus) ?? 'active',
  )
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    selectionsFrom(variant, options),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(variant?.name ?? '')
    setSku(variant?.sku ?? '')
    setStatus((variant?.status as ProductStatus) ?? 'active')
    setChosen(selectionsFrom(variant, options))
    setError(null)
  }, [open, variant, options])

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const payload = {
      name: name.trim(),
      sku: sku.trim() === '' ? null : sku.trim(),
      status,
      option_value_ids: Object.values(chosen).filter(id => id !== UNSET),
    }
    const res = variant
      ? await editVariant(brand, variant.id, payload)
      : await addVariant(brand, productCode, payload)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the variant.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  /** Suggests a name from the chosen values, so nobody types "2 hearts" by hand. */
  function suggestName(): void {
    const labels = options
      .map(option => option.values.find(v => v.id === chosen[option.id])?.label)
      .filter((label): label is string => Boolean(label))
    if (labels.length > 0) setName(labels.join(', '))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{variant ? 'Edit variant' : 'Add variant'}</DialogTitle>
          <DialogDescription>
            A variant is one combination of this product&rsquo;s options — the thing an order
            actually resolves to.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {options.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This product has no options yet. Add an axis first, or save a single variant with no
              options.
            </p>
          ) : (
            options.map(option => (
              <Field key={option.id} label={option.label} htmlFor={`v-${option.id}`}>
                <Select
                  id={`v-${option.id}`}
                  value={chosen[option.id] ?? UNSET}
                  onChange={e => setChosen(prev => ({ ...prev, [option.id]: e.target.value }))}
                >
                  <option value={UNSET}>— not set —</option>
                  {option.values.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ))
          )}

          <Field label="Name" htmlFor="v-name" hint="What this combination is called">
            <div className="flex gap-2">
              <Input
                id="v-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. 2 hearts, With light"
              />
              <Button variant="secondary" size="sm" onClick={suggestName} disabled={pending}>
                From options
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU" htmlFor="v-sku" hint="Optional">
              <Input
                id="v-sku"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. T3DPS-DNP-2"
              />
            </Field>
            <Field label="Status" htmlFor="v-status">
              <Select
                id="v-status"
                value={status}
                onChange={e => setStatus(e.target.value as ProductStatus)}
              >
                {PRODUCT_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={pending || name.trim() === ''}>
              {pending ? 'Saving…' : variant ? 'Save changes' : 'Save variant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
