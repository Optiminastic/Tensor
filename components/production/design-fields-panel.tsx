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
import type { RegistryProductDetail } from '@/lib/validators/registry'

interface DesignFieldsPanelProps {
  brand: string
  product: RegistryProductDetail
}

const FIGURE = 'font-mono tabular-nums'

/**
 * What this product prints from, and which order field fills each of its
 * variables.
 *
 * The two halves are one panel because neither is any use alone, and half a
 * configuration is the failure this page exists to make visible: a template
 * with no mapping renders the same model for every customer, and a mapping
 * with no template renders nothing at all. Both currently say so only in a log
 * line nobody reads.
 *
 * Loaded when opened rather than with the page. The observed properties are
 * read from two hundred recent orders, and making every visit to the registry
 * pay for a panel nobody opened would be the wrong trade for a page that is
 * usually about something else.
 */
export function DesignFieldsPanel({ brand, product }: DesignFieldsPanelProps): JSX.Element {
  const [fields, setFields] = useState<DesignFields | null>(null)
  const [error, setError] = useState<string | null>(null)
  const templateKey = product.variants.find(v => v.design?.template_key)?.design?.template_key ?? ''

  useEffect(() => {
    let cancelled = false
    setFields(null)
    setError(null)
    void loadDesignFields(brand, product.code, templateKey).then(res => {
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
  }, [brand, product.code, templateKey])

  if (error) {
    return (
      <p role="alert" className="text-danger mt-3 text-sm">
        {error}
      </p>
    )
  }
  if (!fields) {
    return <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      <TemplateSection brand={brand} product={product} fields={fields} />

      <div className="border-border flex flex-col gap-2 border-t pt-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">Personalisation fields</h3>
          <p className="text-muted-foreground text-xs">
            What the customer types, and where it goes in the model.
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
          properties={fields.properties}
          params={fields.params}
          maps={fields.maps}
        />
      </div>

      <Readiness fields={fields} />
    </div>
  )
}

interface TemplateSectionProps {
  brand: string
  product: RegistryProductDetail
  fields: DesignFields
}

/**
 * The .scad this product prints from.
 *
 * Product-level, because that is the unit somebody thinks in: every colour of
 * a plank prints from the same file and differs by filament, which is not
 * geometry. Choosing it twenty times, once per SKU, is the same answer typed
 * twenty times and nineteen chances to get one of them wrong.
 */
function TemplateSection({ brand, product, fields }: TemplateSectionProps): JSX.Element {
  const router = useRouter()
  const templates = useDesignTemplates()
  const [choice, setChoice] = useState(fields.template_key)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The key a new upload is filed under. The product code, lower-cased: it is
  // the one name that is already unique per product and already means this
  // product to everyone reading it.
  const newKey = product.code.toLowerCase()

  async function link(key: string): Promise<void> {
    setError(null)
    setPending(true)
    const res = await assignProductDesign(brand, product.code, {
      role: 'body',
      template_key: key,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not set the design.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">Design file</h3>
        <p className="text-muted-foreground text-xs">
          {fields.template_key === ''
            ? 'Nothing prints this product yet.'
            : `Every variant prints from ${fields.template_key}.`}
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
        {/* Uploading under the product's own key, so a product that has never
            had a file gets one in a single step rather than being told to go
            to the Designs tab and come back. */}
        <TemplateUploadButton
          brand={brand}
          templateKey={fields.template_key === '' ? newKey : fields.template_key}
          label={fields.template_key === '' ? `Upload as ${newKey}` : 'Replace file'}
        />
      </div>

      {fields.template_key === '' ? (
        <p className="text-muted-foreground text-xs">
          An upload is filed under <span className={FIGURE}>{newKey}</span>. Choose it above
          afterwards to point this product&rsquo;s variants at it.
        </p>
      ) : (
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
 * Whether this product can actually render, said in one line.
 *
 * Half a configuration is worse than none, because it looks finished. A
 * template with no mapping prints the same model for every customer; a mapping
 * with no template prints nothing. Both states are reachable in two clicks and
 * neither announces itself anywhere else.
 */
function Readiness({ fields }: { fields: DesignFields }): JSX.Element {
  const hasTemplate = fields.template_key !== ''
  const hasMapping = fields.maps.length > 0

  let tone = 'text-muted-foreground'
  let message = ''
  if (hasTemplate && hasMapping) {
    tone = 'text-success'
    message = `Ready: orders for this product render from ${fields.template_key} with ${fields.maps.length} mapped field${fields.maps.length === 1 ? '' : 's'}.`
  } else if (hasTemplate) {
    tone = 'text-warning'
    message =
      'No fields are mapped, so every order renders the same model — the template’s own defaults.'
  } else if (hasMapping) {
    tone = 'text-warning'
    message = 'Fields are mapped but no file prints them, so nothing renders.'
  } else {
    message = 'Not configured. This product falls back to whatever the pipeline decides for it.'
  }

  return (
    <p className={`border-border border-t pt-3 text-xs ${tone}`} role="status">
      {message}
    </p>
  )
}
