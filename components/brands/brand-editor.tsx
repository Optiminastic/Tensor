'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { deleteBrand, updateBrand } from '@/app/dashboard/brands/actions'
import { LogoUpload } from '@/components/brands/logo-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { BrandProfile } from '@/lib/validators/brands'

// Numeric fields use react-hook-form's valueAsNumber, so the form holds numbers
// (empty → NaN, which fails validation). The two optional numbers stay strings
// so "empty" can map cleanly to null on submit. The ladder is a field array so
// rungs can be added and removed.
const FormSchema = z.object({
  name: z.string().min(1, 'Give the brand a name').max(120),
  starting_price: z.number().positive('Must be positive'),
  shopify_url: z.string().max(255),
  description: z.string().max(500),
  is_active: z.enum(['active', 'inactive']),
  cp_green_max: z.number().gt(0).lte(1, 'Use a fraction, e.g. 0.25'),
  cp_yellow_max: z.number().gt(0).lte(1, 'Use a fraction, e.g. 0.30'),
  entry_machine_hours: z.string(),
  entry_rung: z.string(),
  rungs: z
    .array(z.object({ value: z.number().int().positive('Prices must be positive') }))
    .min(1, 'The ladder needs at least one price')
    .refine(
      rungs => rungs.every((r, i) => i === 0 || r.value > rungs[i - 1].value),
      'Prices must be strictly ascending',
    ),
})

type FormValues = z.infer<typeof FormSchema>

interface BrandEditorProps {
  brand: BrandProfile
}

export function BrandEditor({ brand }: BrandEditorProps): JSX.Element {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logo_url)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: brand.name,
      starting_price: brand.starting_price,
      shopify_url: brand.shopify_url ?? '',
      description: brand.description ?? '',
      is_active: brand.is_active ? 'active' : 'inactive',
      cp_green_max: brand.cp_green_max,
      cp_yellow_max: brand.cp_yellow_max,
      entry_machine_hours:
        brand.entry_machine_hours !== null ? String(brand.entry_machine_hours) : '',
      entry_rung: brand.entry_rung !== null ? String(brand.entry_rung) : '',
      rungs: brand.ladder.map(value => ({ value })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'rungs' })

  async function onSubmit(values: FormValues): Promise<void> {
    setFormError(null)
    setSaved(false)
    const result = await updateBrand(brand.slug, {
      name: values.name,
      logo_url: logoUrl,
      starting_price: values.starting_price,
      shopify_url: values.shopify_url.trim() || null,
      description: values.description.trim() || null,
      is_active: values.is_active === 'active',
      cp_green_max: values.cp_green_max,
      cp_yellow_max: values.cp_yellow_max,
      entry_machine_hours: values.entry_machine_hours.trim()
        ? Number(values.entry_machine_hours)
        : null,
      entry_rung: values.entry_rung.trim() ? Number(values.entry_rung) : null,
      ladder: values.rungs.map(r => r.value),
    })
    if (!result.ok) {
      setFormError(result.error ?? 'Could not save the brand.')
      return
    }
    setSaved(true)
    router.refresh()
  }

  function addRung(): void {
    const current = getValues('rungs')
    const last = current.length ? current[current.length - 1].value : 999
    append({ value: (Number.isFinite(last) ? last : 999) + 100 })
  }

  async function onDelete(): Promise<void> {
    setDeleteError(null)
    setDeleting(true)
    const result = await deleteBrand(brand.slug)
    setDeleting(false)
    if (!result.ok) {
      setDeleteError(result.error ?? 'Could not delete the brand.')
      return
    }
    router.push('/dashboard/brands')
    router.refresh()
  }

  const rungError = errors.rungs?.message ?? errors.rungs?.root?.message

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand.name}</CardTitle>
        <CardDescription>
          <span className="text-subtle-foreground font-mono text-xs">{brand.slug}</span>
          <span className="mx-2">·</span>
          Identity, pricing ladder and the CP thresholds the engine uses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {formError ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {formError}
            </p>
          ) : saved ? (
            <p
              role="status"
              className="bg-success-subtle text-success rounded-md px-3 py-2 text-sm"
            >
              Saved. New prices use this immediately.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor={`${brand.slug}-name`} error={errors.name?.message}>
              <Input id={`${brand.slug}-name`} {...register('name')} />
            </Field>
            <Field
              label="Starting price (₹)"
              htmlFor={`${brand.slug}-start`}
              error={errors.starting_price?.message}
            >
              <Input
                id={`${brand.slug}-start`}
                type="number"
                data-numeric="true"
                {...register('starting_price', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Shopify URL" htmlFor={`${brand.slug}-url`} hint="Optional">
              <Input
                id={`${brand.slug}-url`}
                placeholder="https://…"
                {...register('shopify_url')}
              />
            </Field>
            <Field label="Active" htmlFor={`${brand.slug}-active`}>
              <Select id={`${brand.slug}-active`} {...register('is_active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          <Field label="Description" htmlFor={`${brand.slug}-desc`} hint="Optional">
            <Textarea id={`${brand.slug}-desc`} {...register('description')} />
          </Field>

          <Field label="Logo" hint="Optional">
            <LogoUpload value={logoUrl} onChange={setLogoUrl} idPrefix={brand.slug} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Green threshold"
              htmlFor={`${brand.slug}-green`}
              hint="Share of price, e.g. 0.25 = 25%"
              error={errors.cp_green_max?.message}
            >
              <Input
                id={`${brand.slug}-green`}
                type="number"
                step="0.01"
                data-numeric="true"
                {...register('cp_green_max', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Yellow threshold"
              htmlFor={`${brand.slug}-yellow`}
              hint="Must be ≥ green"
              error={errors.cp_yellow_max?.message}
            >
              <Input
                id={`${brand.slug}-yellow`}
                type="number"
                step="0.01"
                data-numeric="true"
                {...register('cp_yellow_max', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Entry machine-hours"
              htmlFor={`${brand.slug}-emh`}
              hint="Optional — target for the entry rung"
            >
              <Input
                id={`${brand.slug}-emh`}
                type="number"
                step="0.1"
                data-numeric="true"
                {...register('entry_machine_hours')}
              />
            </Field>
            <Field
              label="Entry rung (₹)"
              htmlFor={`${brand.slug}-erung`}
              hint="Optional — price the rule applies at"
            >
              <Input
                id={`${brand.slug}-erung`}
                type="number"
                data-numeric="true"
                {...register('entry_rung')}
              />
            </Field>
          </div>

          <Field label="Price ladder (₹, ascending)" error={rungError}>
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    type="number"
                    data-numeric="true"
                    aria-label={`Rung ${index + 1}`}
                    {...register(`rungs.${index}.value`, { valueAsNumber: true })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={addRung}
              >
                Add rung
              </Button>
            </div>
          </Field>

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? 'Saving…' : 'Save brand'}
          </Button>
        </form>

        <div className="border-border mt-6 flex flex-col gap-3 border-t pt-4">
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-sm font-medium">Delete this brand</p>
            <p className="text-muted-foreground text-sm">
              Removes {brand.name} and all its designs, pricing and connections. This cannot be
              undone.
            </p>
          </div>
          {deleteError ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {deleteError}
            </p>
          ) : null}
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : `Delete ${brand.name}`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete brand
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
