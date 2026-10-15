import type { JSX, ReactNode } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { FormSection } from './form-section'
import { ModelFileZone } from './model-file-zone'
import { PreviewImageZone } from './preview-image-zone'
import type { UploadFormValues } from './upload-schema'
import type { ModelFileState } from './use-model-file'

interface DesignFilesSectionProps {
  register: UseFormRegister<UploadFormValues>
  errors: FieldErrors<UploadFormValues>
  model: ModelFileState
  onPreview: (file: File | null) => void
  previewHint: string
  /** The brand picker, in the global view only. */
  brandPicker?: ReactNode
}

/** Section one: what the design is called, its model, and its cover photo. */
export function DesignFilesSection(props: DesignFilesSectionProps): JSX.Element {
  const { register, errors, model, onPreview, previewHint, brandPicker } = props
  return (
    <FormSection label="01 · The design">
      {brandPicker}
      <Field label="Name" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" placeholder="e.g. Hexagon planter" {...register('name')} />
      </Field>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <ModelFileZone file={model.file} inspection={model.inspection} onFile={model.choose} />
        <PreviewImageZone onChange={onPreview} hint={previewHint} />
      </div>
    </FormSection>
  )
}
