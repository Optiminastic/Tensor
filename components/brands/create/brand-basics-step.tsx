'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { LogoUpload } from '@/components/brands/logo-upload'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import type { BrandBasicsDraft } from './types'

// Slug is optional — the backend derives it from the name when blank.
const FormSchema = z.object({
  name: z.string().min(1, 'Give the brand a name').max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9]*(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens')
    .max(120),
  description: z.string().max(500),
})

type FormValues = z.infer<typeof FormSchema>

interface BrandBasicsStepProps {
  initial: BrandBasicsDraft | null
  onDone: (basics: BrandBasicsDraft) => void
}

export function BrandBasicsStep({ initial, onDone }: BrandBasicsStepProps): JSX.Element {
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
    },
  })

  function onSubmit(values: FormValues): void {
    onDone({
      name: values.name,
      slug: values.slug.trim(),
      description: values.description.trim(),
      logoUrl,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Field label="Name" htmlFor="brand-name" error={errors.name?.message}>
        <Input id="brand-name" placeholder="Personalised Gifting" autoFocus {...register('name')} />
      </Field>

      <Field label="Logo" hint="Optional">
        <LogoUpload value={logoUrl} onChange={setLogoUrl} idPrefix="brand" />
      </Field>

      <Field
        label="Description"
        htmlFor="brand-desc"
        hint="Optional — what this brand is about"
        error={errors.description?.message}
      >
        <Textarea id="brand-desc" rows={3} {...register('description')} />
      </Field>

      <Field
        label="Slug"
        htmlFor="brand-slug"
        hint="Optional — the URL id, derived from the name if blank"
        error={errors.slug?.message}
      >
        <Input id="brand-slug" placeholder="personalised-gifting" {...register('slug')} />
      </Field>

      <Button type="submit" className="self-start">
        Next
      </Button>
    </form>
  )
}
