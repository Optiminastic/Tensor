'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { JSX } from 'react'
import { type FieldError, useForm } from 'react-hook-form'
import { z } from 'zod'

import { FILAMENT_MATERIALS } from '@/components/production/sample-data'
import type { FilamentRecord } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const FormSchema = z.object({
  material: z.string().min(1),
  brand: z.string().min(1, 'Enter a brand'),
  color: z.string().min(1, 'Enter a color'),
  quantity: z.number().positive('Must be greater than 0'),
  quantityUnit: z.enum(['kg', 'count']),
  diameterMm: z.number().positive('Must be greater than 0'),
  densityGCm3: z.number().positive('Must be greater than 0'),
  price: z.number().nonnegative('Must be 0 or more'),
})
type FormValues = z.infer<typeof FormSchema>

const DEFAULTS: FormValues = {
  material: FILAMENT_MATERIALS[0],
  brand: '',
  color: '',
  quantity: 1,
  quantityUnit: 'kg',
  diameterMm: 1.75,
  densityGCm3: 1.24,
  price: 0,
}

interface AddFilamentFormProps {
  onAdd: (filament: FilamentRecord) => void
}

/** Local-only: adds a row to the in-memory table. No backend to persist to yet. */
export function AddFilamentForm({ onAdd }: AddFilamentFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: DEFAULTS })

  function onSubmit(values: FormValues): void {
    onAdd({ id: `fil-${crypto.randomUUID().slice(0, 8)}`, ...values })
    reset(DEFAULTS)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-5 py-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Material" htmlFor="material" error={errors.material?.message}>
          <Select id="material" {...register('material')}>
            {FILAMENT_MATERIALS.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Brand" htmlFor="brand" error={errors.brand?.message}>
          <Input id="brand" placeholder="e.g. eSun" {...register('brand')} />
        </Field>
        <Field label="Color" htmlFor="color" error={errors.color?.message}>
          <Input id="color" placeholder="e.g. White" {...register('color')} />
        </Field>
        <Field
          label="Diameter (mm)"
          htmlFor="diameterMm"
          error={(errors.diameterMm as FieldError | undefined)?.message}
        >
          <Input
            id="diameterMm"
            type="number"
            step="0.01"
            data-numeric="true"
            {...register('diameterMm', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Quantity" htmlFor="quantity" error={errors.quantity?.message}>
          <div className="flex gap-2">
            <Input
              id="quantity"
              type="number"
              step="0.01"
              data-numeric="true"
              className="flex-1"
              {...register('quantity', { valueAsNumber: true })}
            />
            <Select className="w-28" {...register('quantityUnit')}>
              <option value="kg">kg</option>
              <option value="count">count</option>
            </Select>
          </div>
        </Field>
        <Field
          label="Density (g/cm³)"
          htmlFor="densityGCm3"
          error={(errors.densityGCm3 as FieldError | undefined)?.message}
        >
          <Input
            id="densityGCm3"
            type="number"
            step="0.01"
            data-numeric="true"
            {...register('densityGCm3', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Price (₹)" htmlFor="price" error={errors.price?.message}>
          <Input
            id="price"
            type="number"
            step="1"
            data-numeric="true"
            {...register('price', { valueAsNumber: true })}
          />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        Add filament
      </Button>
    </form>
  )
}
