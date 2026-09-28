'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX } from 'react'

import {
  assignProductDesign,
  loadDesignFields,
  type DesignFields,
} from '@/app/dashboard/[brand]/production/design-fields-actions'
import { useDesignTemplates } from '@/components/production/design-templates-context'
import { FieldMapEditor } from '@/components/production/field-map-editor'
import { TemplateUploadButton } from '@/components/production/template-upload-button'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ProductPart, RegistryProductDetail } from '@/lib/validators/registry'

interface DesignPartEditorProps {
  brand: string
  product: RegistryProductDetail
  part: ProductPart
  /** Called after a change the parts list needs to reflect. */
  onChanged: () => void
}

/**
 * One of the things a product prints: its file, and the fields that fill it.
 *
 * The two halves are together because neither is any use alone, and half a
 * configuration is the failure worth making visible: a file with no mapping
 * renders the same model for every customer, and a mapping with no file
 * renders nothing. Both said so only in a log line before this.
 */
export function DesignPartEditor({
  brand,
  product,
  part,
  onChanged,
}: DesignPartEditorProps): JSX.Element {
  const [fields, setFields] = useState<DesignFields | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setFields(null)
    setError(null)
    void loadDesignFields(brand, product.code, {
      role: part.role,
      template_key: part.template_key,
    }).then(res => {
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'Could not load the design fields.')
        return
      }
      setFields(res.data ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [brand, product.code, part.role, part.template_key])

  if (error) {
    return (
      <p role="alert" className="text-danger text-sm">
        {error}
      </p>
    )
  }
  if (!fields) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }

  return (
    <div className="border-border flex flex-col gap-4 rounded-md border p-3">
      <TemplateSection
        brand={brand}
        productCode={product.code}
        part={part}
        fields={fields}
        onChanged={onChanged}
      />

      <div className="border-border flex flex-col gap-2 border-t pt-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">Personalisation fields</h3>
          <p className="text-muted-foreground text-xs">
            What the customer types, and where it goes in this file.
          </p>
        </div>

        {fields.properties.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recent order has carried a personalisation field for this product&rsquo;s SKUs.
            Either none needs one, or no order has matched it yet.
          </p>
        ) : null}

        <FieldMapEditor
          brand={brand}
          productCode={product.code}
          role={part.role}
          properties={fields.properties}
          params={fields.params}
          maps={fields.maps}
          onSaved={onChanged}
        />
      </div>

      <Readiness fields={fields} />
    </div>
  )
}

interface TemplateSectionProps {
  brand: string
  productCode: string
  part: ProductPart
  fields: DesignFields
  onChanged: () => void
}

/**
 * The .scad this part prints from.
 *
 * Set for the whole product rather than per variant: every colour of a plank
 * prints from the same file and differs by filament, which is not geometry.
 * Choosing it twenty times, once per SKU, is nineteen chances to get one wrong.
 */
function TemplateSection({
  brand,
  productCode,
  part,
  fields,
  onChanged,
}: TemplateSectionProps): JSX.Element {
  const router = useRouter()
  const templates = useDesignTemplates()
  const [choice, setChoice] = useState(fields.template_key)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function link(key: string): Promise<void> {
    setError(null)
    setPending(true)
    const res = await assignProductDesign(brand, productCode, {
      role: part.role,
      template_key: key,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not set the design.')
      return
    }
    onChanged()
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">Design file</h3>
        <p className="text-muted-foreground text-xs">
          {fields.template_key === ''
            ? `Nothing prints the ${part.role} yet.`
            : `Every variant's ${part.role} prints from ${fields.template_key}.`}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs">Prints from</span>
          <Select value={choice} onChange={e => setChoice(e.target.value)} disabled={pending}>
            <option value="">Choose a template…</option>
            {templates.map(t => (
              <option key={t.key} value={t.key}>
                {t.key}
                {t.source === 'uploaded' ? ` · v${t.version}` : ' · built in'}
              </option>
            ))}
          </Select>
        </label>
        <Button
          size="sm"
          disabled={pending || choice === '' || choice === fields.template_key}
          onClick={() => void link(choice)}
        >
          {pending ? 'Saving…' : 'Use this file'}
        </Button>
        {fields.template_key === '' ? null : (
          <TemplateUploadButton
            brand={brand}
            templateKey={fields.template_key}
            label="Replace file"
          />
        )}
      </div>

      {fields.template_key === '' ? null : (
        <p className="text-subtle-foreground text-xs">
          {fields.params.length > 0
            ? `${fields.params.length} variables declared.`
            : 'This file declares no variables Tensor can read, so nothing can be mapped into it.'}
        </p>
      )}

      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Whether this part can actually render, said in one line.
 *
 * Half a configuration is worse than none, because it looks finished. A file
 * with no mapping prints the same model for every customer; a mapping with no
 * file prints nothing. Both are reachable in two clicks.
 */
function Readiness({ fields }: { fields: DesignFields }): JSX.Element {
  const hasTemplate = fields.template_key !== ''
  const hasMapping = fields.maps.length > 0
  const optional = fields.maps.filter(m => !m.required).length

  let tone = 'text-muted-foreground'
  let message: string
  if (hasTemplate && hasMapping) {
    tone = 'text-success'
    const required = fields.maps.length - optional
    message =
      `Ready: this part renders from ${fields.template_key} with ${required} required ` +
      `field${required === 1 ? '' : 's'}` +
      (optional > 0 ? ` and ${optional} optional.` : '.')
  } else if (hasTemplate) {
    tone = 'text-warning'
    message =
      'No fields are mapped, so every order renders the same model — the template’s own defaults.'
  } else if (hasMapping) {
    tone = 'text-warning'
    message = 'Fields are mapped but no file prints them, so this part renders nothing.'
  } else {
    message = 'Not configured. No job is created for this part.'
  }

  return (
    <p role="status" className={`border-border border-t pt-3 text-xs ${tone}`}>
      {message}
    </p>
  )
}
