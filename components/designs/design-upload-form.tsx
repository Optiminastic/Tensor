'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type JSX } from 'react'
import { type FieldError, useForm } from 'react-hook-form'
import { z } from 'zod'

import { uploadDesign } from '@/app/dashboard/[brand]/designs/actions'
import { isAllBrands } from '@/components/dashboard/nav-config'
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

import { inspectModelFile, type ModelInspection } from './model-colours'
import { ModelFormatNotice } from './model-format-notice'
import { PreviewImageField } from './preview-image-field'

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

/** A Shopify listing being imported into a design: its id + a price snapshot and
 * its photo, so the backend can use that photo as the cover and the design detail
 * can compare true cost against the listing price. */
export interface ShopifyImportSource {
  product_gid: string
  handle: string
  admin_url: string
  image_url: string
  min_price: string
  max_price: string
  currency: string
}

/** A brand the user may create a design under, offered in the global view where
 * the route brand is the "all" sentinel. */
export interface BrandChoice {
  slug: string
  name: string
}

interface DesignUploadFormProps {
  brand: string
  onDone?: () => void
  // Pre-fills the name; when set, this design is imported from a Shopify listing
  // (the preview defaults to the listing photo and the snapshot rides along).
  defaultName?: string
  shopify?: ShopifyImportSource
  // In the global "all brands" view the route brand is the "all" sentinel, so the
  // user must choose a real target brand. Absent in a single-brand context.
  brandOptions?: BrandChoice[]
}

/** Upload an STL and its answers; the backend slices it and returns the pre-check. */
const MAX_PREVIEW_MB = 10

interface BuildFormArgs {
  values: FormValues
  file: File
  preview: File | null
  shopify?: ShopifyImportSource
  // Colours auto-detected from a 3MF, sent so the backend can keep the full
  // palette alongside the (length-capped) Colour field.
  detectedColours?: string[]
}

// buildDesignFormData assembles the multipart body. When importing, the preview
// falls back to the Shopify photo URL and the snapshot fields ride along.
function buildDesignFormData({
  values,
  file,
  preview,
  shopify,
  detectedColours,
}: BuildFormArgs): FormData {
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
  if (detectedColours && detectedColours.length > 0) {
    form.set('detected_colours', detectedColours.join(','))
  }
  form.set('file', file)
  if (preview) form.set('preview', preview)
  else if (shopify?.image_url) form.set('preview_url', shopify.image_url)
  if (shopify) {
    form.set('shopify_product_gid', shopify.product_gid)
    form.set('shopify_handle', shopify.handle)
    form.set('shopify_admin_url', shopify.admin_url)
    form.set('shopify_min_price', shopify.min_price)
    form.set('shopify_max_price', shopify.max_price)
    form.set('shopify_currency', shopify.currency)
  }
  return form
}

export function DesignUploadForm({
  brand,
  onDone,
  defaultName,
  shopify,
  brandOptions,
}: DesignUploadFormProps): JSX.Element {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The auto-detected format + 3MF colours for the picked file, shown as a notice.
  const [inspection, setInspection] = useState<ModelInspection | null>(null)
  const [inspecting, setInspecting] = useState(false)
  // In the global view the design must be created under a chosen brand.
  const needsBrandChoice = isAllBrands(brand)
  const [targetBrand, setTargetBrand] = useState(brandOptions?.[0]?.slug ?? '')
  const effectiveBrand = needsBrandChoice ? targetBrand : brand

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ...DEFAULTS, name: defaultName ?? DEFAULTS.name },
  })

  function onFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const picked = event.target.files?.[0] ?? null
    setFile(picked)
    void inspectSelected(picked)
  }

  // Reads the picked file to auto-detect its format and, for a 3MF, its colours -
  // then pre-fills the Colour and Colour-count fields so the designer does not
  // re-enter what the file already carries.
  async function inspectSelected(picked: File | null): Promise<void> {
    if (!picked) {
      setInspection(null)
      return
    }
    setInspecting(true)
    try {
      const result = await inspectModelFile(picked)
      setInspection(result)
      applyDetectedColours(result)
    } catch {
      setInspection(null)
    } finally {
      setInspecting(false)
    }
  }

  function applyDetectedColours(result: ModelInspection): void {
    if (result.format !== '3mf' || result.colours.length === 0) {
      return
    }
    setValue('colour_count', Math.min(20, result.colours.length))
    setValue('colour', result.colours.join(', ').slice(0, 60))
  }

  async function onSubmit(values: FormValues): Promise<void> {
    setError(null)
    if (needsBrandChoice && !effectiveBrand) {
      setError('Choose a brand for this design.')
      return
    }
    if (!file) {
      setError('Choose an STL, 3MF or STEP file.')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`The model is larger than the ${MAX_FILE_MB} MB limit.`)
      return
    }
    // Importing from Shopify uses the listing photo as the cover, so a manual
    // preview is optional when the listing has one; otherwise it is still required.
    if (!preview && !shopify?.image_url) {
      setError('Upload a preview image for the design.')
      return
    }
    if (preview && preview.size > MAX_PREVIEW_MB * 1024 * 1024) {
      setError(`The preview image is larger than the ${MAX_PREVIEW_MB} MB limit.`)
      return
    }

    const form = buildDesignFormData({
      values,
      file,
      preview,
      shopify,
      detectedColours: inspection?.colours,
    })
    const outcome = await uploadDesign(effectiveBrand, form)
    if (!outcome.ok || !outcome.data) {
      setError(outcome.error ?? 'Could not upload this design.')
      return
    }
    onDone?.()
    router.push(`/dashboard/${effectiveBrand}/designs/${outcome.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {needsBrandChoice ? (
        <Field
          label="Brand"
          htmlFor="target-brand"
          required
          hint="Which brand this design belongs to"
        >
          <Select
            id="target-brand"
            value={targetBrand}
            onChange={event => setTargetBrand(event.target.value)}
          >
            {(brandOptions ?? []).map(option => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Name" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" placeholder="e.g. Hexagon planter" {...register('name')} />
      </Field>

      <Field label="Model file" htmlFor="file" hint={`STL, 3MF or STEP, up to ${MAX_FILE_MB} MB`}>
        <Input id="file" type="file" accept={ACCEPT} onChange={onFileChange} />
      </Field>
      <ModelFormatNotice inspection={inspection} loading={inspecting} />

      <PreviewImageField
        onChange={setPreview}
        optional={Boolean(shopify)}
        hint={
          shopify
            ? 'Optional - defaults to the Shopify listing photo'
            : `PNG, JPG or WEBP, up to ${MAX_PREVIEW_MB} MB - its background is removed automatically`
        }
      />

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
