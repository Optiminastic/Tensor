'use client'

import { useState, type JSX } from 'react'

import { editDescriptionForBrand } from '@/app/dashboard/[brand]/designs/content-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import type { DesignDetail } from '@/lib/validators/designs'

interface ProductDescriptionCardProps {
  brand: string
  design: DesignDetail
  onChanged: () => void
}

/**
 * Where the Marketing Head writes the product marketing copy (design:content).
 * It is stored on the design and pre-fills the "Approve & push to Shopify" dialog,
 * so the Project Lead publishes copy that was written, not typed from scratch.
 */
export function ProductDescriptionCard({
  brand,
  design,
  onChanged,
}: ProductDescriptionCardProps): JSX.Element {
  const [description, setDescription] = useState(design.attributes?.product_description ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(): Promise<void> {
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await editDescriptionForBrand(brand, design.id, description)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the description.')
      return
    }
    setSaved(true)
    onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product description</CardTitle>
        <CardDescription>
          The marketing copy shown on the Shopify product page. Blank lines start new paragraphs. It
          pre-fills the publish dialog.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field label="Description" htmlFor="product-description" error={error ?? undefined}>
          <Textarea
            id="product-description"
            rows={8}
            maxLength={8000}
            value={description}
            placeholder="Write the customer-facing product description..."
            onChange={event => {
              setDescription(event.target.value)
              setSaved(false)
            }}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => void save()} disabled={busy}>
            {busy ? 'Saving…' : 'Save description'}
          </Button>
          {saved ? <span className="text-success text-sm">Saved.</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}
