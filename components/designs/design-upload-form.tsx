'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type JSX } from 'react'
import { type FieldError, useForm } from 'react-hook-form'
import { z } from 'zod'

import { uploadDesign } from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FinishSchema, MaterialSchema, QualitySchema } from '@/lib/validators/designs'

const MAX_FILE_MB = 60
const ACCEPT = '.stl,.3mf,.step,.stp'

const MATERIALS = ['PLA', 'PETG', 'ABS'] as const
const FINISHES: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sanded', label: 'Sanded' },
  { value: 'painted', label: 'Painted' },
]
const QUALITIES: { value: string; label: string }[] = [
  { value: 'draft', label: 'Draft (0.24mm)' },
  { value: 'standard', label: 'Standard (0.20mm)' },
  { value: 'fine', label: 'Fine (0.12mm)' },
]

const FormSchema = z.object({
  name: z.string().min(1, 'Give the design a name').max(160),
  material: MaterialSchema,
  colour: z.string().max(60).optional(),
  finish: FinishSchema,
  units_per_bed: z.number().int().min(1).max(100),
  quality: QualitySchema,
  infill_pct: z.number().min(0).max(100),
})
type FormValues = z.infer<typeof FormSchema>

const DEFAULTS: FormValues = {
  name: '',
  material: 'PLA',
  colour: '',
  finish: 'none',
  units_per_bed: 1,
  quality: 'standard',
  infill_pct: 15,
}

interface DesignUploadFormProps {
  brand: string
  onDone?: () => void
}

/** Upload an STL and its answers; the backend slices it and returns the pre-check. */
export function DesignUploadForm({ brand, onDone }: DesignUploadFormProps): JSX.Element {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: DEFAULTS })

  function onFileChange(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null)
  }

  async function onSubmit(values: FormValues): Promise<void> {
    setError(null)
    if (!file) {
      setError('Choose an STL, 3MF or STEP file.')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`The model is larger than the ${MAX_FILE_MB} MB limit.`)
      return
    }
    const form = new FormData()
    form.set('name', values.name)
    form.set('material', values.material)
    if (values.colour) form.set('colour', values.colour)
    form.set('finish', values.finish)
    form.set('units_per_bed', String(values.units_per_bed))
    form.set('quality', values.quality)
    form.set('infill_pct', String(values.infill_pct))
    form.set('file', file)

    const outcome = await uploadDesign(brand, form)
    if (!outcome.ok || !outcome.data) {
      setError(outcome.error ?? 'Could not upload this design.')
      return
    }
    onDone?.()
    router.push(`/dashboard/${brand}/designs/${outcome.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label="Name" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" placeholder="e.g. Hexagon planter" {...register('name')} />
      </Field>

      <Field label="Model file" htmlFor="file" hint={`STL, 3MF or STEP, up to ${MAX_FILE_MB} MB`}>
        <Input id="file" type="file" accept={ACCEPT} onChange={onFileChange} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Material" htmlFor="material" error={errors.material?.message}>
          <Select id="material" {...register('material')}>
            {MATERIALS.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quality" htmlFor="quality" error={errors.quality?.message}>
          <Select id="quality" {...register('quality')}>
            {QUALITIES.map(q => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Finish" htmlFor="finish" error={errors.finish?.message}>
          <Select id="finish" {...register('finish')}>
            {FINISHES.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Colour" htmlFor="colour" hint="Optional">
          <Input id="colour" placeholder="e.g. Matte black" {...register('colour')} />
        </Field>
        <Field
          label="Units per bed"
          htmlFor="units_per_bed"
          error={(errors.units_per_bed as FieldError | undefined)?.message}
        >
          <Input
            id="units_per_bed"
            type="number"
            step="1"
            data-numeric="true"
            {...register('units_per_bed', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Infill %"
          htmlFor="infill_pct"
          error={(errors.infill_pct as FieldError | undefined)?.message}
        >
          <Input
            id="infill_pct"
            type="number"
            step="1"
            data-numeric="true"
            {...register('infill_pct', { valueAsNumber: true })}
          />
        </Field>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Uploading…' : 'Upload and slice'}
      </Button>
    </form>
  )
}
