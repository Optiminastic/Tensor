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
import { Textarea } from '@/components/ui/textarea'
import {
  DesignMachineSpecSchema,
  FinishSchema,
  MaterialSchema,
  QUALITY_OPTIONS,
  QualitySchema,
} from '@/lib/validators/designs'

const MAX_FILE_MB = 60
const ACCEPT = '.stl,.3mf,.step,.stp'

const MATERIALS = MaterialSchema.options
const FINISHES: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sanded', label: 'Sanded' },
  { value: 'painted', label: 'Painted' },
]
const NOZZLES_MM = [0.2, 0.4, 0.6, 0.8] as const
const FLOWS: { value: 'standard' | 'high_flow'; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'high_flow', label: 'High Flow' },
]

const FormSchema = z
  .object({
    name: z.string().min(1, 'Give the design a name').max(160),
    material: MaterialSchema,
    colour: z.string().max(60).optional(),
    finish: FinishSchema,
    units_per_bed: z.number().int().min(1).max(100),
    quality: QualitySchema,
    infill_pct: z.number().min(0).max(100),
    notes: z.string().max(2000).optional(),
    product_type: z.string().max(80).optional(),
    personalisation_type: z.string().max(80).optional(),
    colour_count: z.coerce.number().int().min(1).max(20).optional(),
    add_ons: z.string().max(200).optional(),
    packaging_type: z.string().max(80).optional(),
  })
  .extend(DesignMachineSpecSchema.shape)
type FormValues = z.infer<typeof FormSchema>

const DEFAULTS: FormValues = {
  name: '',
  material: 'PLA Basics',
  colour: '',
  finish: 'none',
  units_per_bed: 1,
  quality: '0.20-standard',
  infill_pct: 15,
  notes: '',
  product_type: '',
  personalisation_type: '',
  colour_count: 1,
  add_ons: '',
  packaging_type: '',
  left_nozzle_mm: 0.4,
  right_nozzle_mm: 0.4,
  left_flow: 'standard',
  right_flow: 'standard',
}

interface DesignUploadFormProps {
  brand: string
  onDone?: () => void
}

/** Upload an STL and its answers; the backend slices it and returns the pre-check. */
const MAX_PREVIEW_MB = 10

export function DesignUploadForm({ brand, onDone }: DesignUploadFormProps): JSX.Element {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: DEFAULTS })

  function onFileChange(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null)
  }

  function onPreviewChange(event: ChangeEvent<HTMLInputElement>): void {
    setPreview(event.target.files?.[0] ?? null)
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
    if (!preview) {
      setError('Upload a preview image for the design.')
      return
    }
    if (preview.size > MAX_PREVIEW_MB * 1024 * 1024) {
      setError(`The preview image is larger than the ${MAX_PREVIEW_MB} MB limit.`)
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
    if (values.notes) form.set('notes', values.notes)
    if (values.product_type) form.set('product_type', values.product_type)
    if (values.personalisation_type) form.set('personalisation_type', values.personalisation_type)
    if (values.colour_count) form.set('colour_count', String(values.colour_count))
    if (values.add_ons) form.set('add_ons', values.add_ons)
    if (values.packaging_type) form.set('packaging_type', values.packaging_type)
    form.set('left_nozzle_mm', String(values.left_nozzle_mm))
    form.set('right_nozzle_mm', String(values.right_nozzle_mm))
    form.set('left_flow', values.left_flow)
    form.set('right_flow', values.right_flow)
    form.set('file', file)
    form.set('preview', preview)

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

      <Field
        label="Preview image"
        htmlFor="preview"
        hint={`PNG, JPG, WEBP or GIF, up to ${MAX_PREVIEW_MB} MB - shown as the cover`}
      >
        <Input id="preview" type="file" accept="image/*" onChange={onPreviewChange} />
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
            {QUALITY_OPTIONS.map(q => (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Left nozzle"
          htmlFor="left_nozzle_mm"
          hint="mm"
          error={(errors.left_nozzle_mm as FieldError | undefined)?.message}
        >
          <Select
            id="left_nozzle_mm"
            data-numeric="true"
            {...register('left_nozzle_mm', { valueAsNumber: true })}
          >
            {NOZZLES_MM.map(n => (
              <option key={n} value={n}>
                {n.toFixed(1)} mm
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Left flow" htmlFor="left_flow" error={errors.left_flow?.message}>
          <Select id="left_flow" {...register('left_flow')}>
            {FLOWS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Right nozzle"
          htmlFor="right_nozzle_mm"
          hint="mm"
          error={(errors.right_nozzle_mm as FieldError | undefined)?.message}
        >
          <Select
            id="right_nozzle_mm"
            data-numeric="true"
            {...register('right_nozzle_mm', { valueAsNumber: true })}
          >
            {NOZZLES_MM.map(n => (
              <option key={n} value={n}>
                {n.toFixed(1)} mm
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Right flow" htmlFor="right_flow" error={errors.right_flow?.message}>
          <Select id="right_flow" {...register('right_flow')}>
            {FLOWS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product type" htmlFor="product_type" hint="Optional">
          <Input
            id="product_type"
            placeholder="e.g. nameplate, planter"
            {...register('product_type')}
          />
        </Field>
        <Field label="Personalisation type" htmlFor="personalisation_type" hint="Optional">
          <Input
            id="personalisation_type"
            placeholder="e.g. name, photo"
            {...register('personalisation_type')}
          />
        </Field>
        <Field label="Colour count" htmlFor="colour_count" hint="Optional">
          <Input
            id="colour_count"
            type="number"
            min={1}
            max={20}
            {...register('colour_count', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Packaging type" htmlFor="packaging_type" hint="Optional">
          <Input
            id="packaging_type"
            placeholder="e.g. box, mailer"
            {...register('packaging_type')}
          />
        </Field>
      </div>
      <Field
        label="Add-ons"
        htmlFor="add_ons"
        hint="Comma-separated, optional (e.g. light, base, stand)"
      >
        <Input id="add_ons" placeholder="light, base, stand, frame" {...register('add_ons')} />
      </Field>

      <Field label="Notes for Project Lead" htmlFor="notes" hint="Optional">
        <Textarea
          id="notes"
          rows={3}
          placeholder="Anything the reviewer should know about this design"
          {...register('notes')}
        />
      </Field>

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
