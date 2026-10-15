'use client'

import type { JSX } from 'react'

import { PillButton } from '@/components/landing/pill-button'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

import { FormError } from './review/form-error'
import { BrandPicker } from './upload/brand-picker'
import { DesignFilesSection } from './upload/design-files-section'
import { FormSection } from './upload/form-section'
import { MachineFields } from './upload/machine-fields'
import { PrintSettingsFields } from './upload/print-settings-fields'
import { ProductFields } from './upload/product-fields'
import { type BrandChoice, MAX_PREVIEW_MB, type ShopifyImportSource } from './upload/upload-schema'
import { type DesignUploadOptions, useDesignUpload } from './upload/use-design-upload'

export type { BrandChoice, ShopifyImportSource }

/**
 * Upload a model and its answers, in four short sections; the backend slices
 * it and returns the pre-check. With `shopify` set, the design is imported
 * from that listing and its photo stands in for the preview.
 */
export function DesignUploadForm(props: DesignUploadOptions): JSX.Element {
  const { form, model, setPreview, error, brandChoice, submit } = useDesignUpload(props)
  const { register, formState } = form
  const { errors } = formState
  const previewHint = props.shopify
    ? 'Optional: the Shopify listing photo is used otherwise'
    : `PNG, JPG or WEBP, up to ${MAX_PREVIEW_MB} MB`

  return (
    <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-6" noValidate>
      <DesignFilesSection
        register={register}
        errors={errors}
        model={model}
        onPreview={setPreview}
        previewHint={previewHint}
        brandPicker={
          brandChoice.needed ? (
            <BrandPicker
              options={props.brandOptions ?? []}
              value={brandChoice.value}
              onChange={brandChoice.set}
            />
          ) : null
        }
      />
      <FormSection
        label="02 · Print settings"
        description="What the slicer costs it with. You can re-slice with other settings later."
      >
        <PrintSettingsFields register={register} errors={errors} />
      </FormSection>
      <FormSection label="03 · Printer">
        <MachineFields register={register} errors={errors} />
      </FormSection>
      <FormSection label="04 · For the reviewer">
        <ProductFields register={register} />
        <Field label="Notes for the Project Lead" htmlFor="notes">
          <Textarea
            id="notes"
            rows={3}
            className="rounded-2xl"
            placeholder="Anything the reviewer should know about this design"
            {...register('notes')}
          />
        </Field>
      </FormSection>
      <UploadFooter error={error} submitting={formState.isSubmitting} />
    </form>
  )
}

interface UploadFooterProps {
  error: string | null
  submitting: boolean
}

function UploadFooter({ error, submitting }: UploadFooterProps): JSX.Element {
  return (
    <div className="border-border flex flex-col gap-3 border-t pt-5">
      <FormError error={error} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Slicing takes a minute or two; the page updates on its own.
        </p>
        <PillButton type="submit" tone="lime" withArrow disabled={submitting}>
          {submitting ? 'Uploading...' : 'Upload and slice'}
        </PillButton>
      </div>
    </div>
  )
}
