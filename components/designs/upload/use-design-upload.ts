'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { uploadDesign } from '@/app/dashboard/[brand]/designs/actions'
import { isAllBrands } from '@/components/dashboard/nav-config'

import { buildDesignFormData } from './design-form-data'
import {
  type BrandChoice,
  detectedColourFields,
  fileProblem,
  type ShopifyImportSource,
  UPLOAD_DEFAULTS,
  UploadFormSchema,
  type UploadFormValues,
} from './upload-schema'
import { type ModelFileState, useModelFile } from './use-model-file'

export interface DesignUploadOptions {
  brand: string
  onDone?: () => void
  defaultName?: string
  shopify?: ShopifyImportSource
  brandOptions?: BrandChoice[]
}

export interface DesignUpload {
  form: UseFormReturn<UploadFormValues>
  model: ModelFileState
  setPreview: (file: File | null) => void
  error: string | null
  brandChoice: { needed: boolean; value: string; set: (slug: string) => void }
  submit: (values: UploadFormValues) => Promise<void>
}

/**
 * Everything the upload form holds: the fields, the two files, the target
 * brand, and the submit that checks the files, uploads, then opens the new
 * design (where the slice runs and the page polls it).
 */
export function useDesignUpload(options: DesignUploadOptions): DesignUpload {
  const { brand, onDone, defaultName, shopify, brandOptions } = options
  const router = useRouter()
  const [preview, setPreview] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [targetBrand, setTargetBrand] = useState(brandOptions?.[0]?.slug ?? '')
  const needsBrand = isAllBrands(brand)
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(UploadFormSchema),
    defaultValues: { ...UPLOAD_DEFAULTS, name: defaultName ?? UPLOAD_DEFAULTS.name },
  })
  const model = useModelFile(colours => {
    const detected = detectedColourFields(colours)
    form.setValue('colour', detected.colour)
    form.setValue('colour_count', detected.count)
  })

  async function submit(values: UploadFormValues): Promise<void> {
    const target = needsBrand ? targetBrand : brand
    const hasListingPhoto = Boolean(shopify?.image_url)
    const problem = target
      ? fileProblem({ model: model.file, preview, hasListingPhoto })
      : 'Choose a brand for this design.'
    setError(problem)
    if (problem || !model.file) return
    const detectedColours = model.inspection.result?.colours
    const body = buildDesignFormData({
      values,
      file: model.file,
      preview,
      shopify,
      detectedColours,
    })
    const outcome = await uploadDesign(target, body)
    if (!outcome.ok || !outcome.data)
      return setError(outcome.error ?? 'Could not upload this design.')
    onDone?.()
    router.push(`/dashboard/${target}/designs/${outcome.data.id}`)
  }

  const brandChoice = { needed: needsBrand, value: targetBrand, set: setTargetBrand }
  return { form, model, setPreview, error, brandChoice, submit }
}
