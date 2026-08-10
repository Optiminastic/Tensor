'use client'

import { useState, type JSX } from 'react'

import {
  editAttributesForBrand,
  editNotesForBrand,
  replacePreviewForBrand,
} from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { DesignDetail } from '@/lib/validators/designs'

interface EditCardProps {
  brand: string
  design: DesignDetail
  onChanged: () => void
}

/** The design:update edit cards on the Settings tab: cover image, notes, and the
 * upload-metadata attributes. Rendered only when the caller holds design:update. */
export function DesignEditCards({ brand, design, onChanged }: EditCardProps): JSX.Element {
  return (
    <>
      <CoverCard brand={brand} design={design} onChanged={onChanged} />
      <NotesCard brand={brand} design={design} onChanged={onChanged} />
      <AttributesCard brand={brand} design={design} onChanged={onChanged} />
    </>
  )
}

interface SaveRowProps {
  busy: boolean
  saved: boolean
  disabled?: boolean
  onClick: () => void
}

function SaveRow({ busy, saved, disabled, onClick }: SaveRowProps): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm" onClick={onClick} disabled={busy || disabled}>
        {busy ? 'Saving…' : 'Save'}
      </Button>
      {saved ? <span className="text-success text-sm">Saved.</span> : null}
    </div>
  )
}

function CoverCard({ brand, design, onChanged }: EditCardProps): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(): Promise<void> {
    if (!file) return
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await replacePreviewForBrand(brand, design.id, file)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not update the cover.')
      return
    }
    setSaved(true)
    setFile(null)
    onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover image</CardTitle>
        <CardDescription>
          The image shown as this design&apos;s cover across Tensor.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field
          label="New cover"
          htmlFor="design-cover"
          hint="PNG, JPG, WEBP or GIF, up to 10 MB"
          error={error ?? undefined}
        >
          <Input
            id="design-cover"
            type="file"
            accept="image/*"
            onChange={e => {
              setFile(e.target.files?.[0] ?? null)
              setSaved(false)
            }}
          />
        </Field>
        <SaveRow busy={busy} saved={saved} disabled={!file} onClick={() => void save()} />
      </CardContent>
    </Card>
  )
}

function NotesCard({ brand, design, onChanged }: EditCardProps): JSX.Element {
  const [notes, setNotes] = useState(design.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(): Promise<void> {
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await editNotesForBrand(brand, design.id, notes)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the notes.')
      return
    }
    setSaved(true)
    onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Context for the Project Lead reviewing this design.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field label="Designer notes" htmlFor="design-notes" error={error ?? undefined}>
          <Textarea
            id="design-notes"
            rows={4}
            maxLength={2000}
            value={notes}
            onChange={e => {
              setNotes(e.target.value)
              setSaved(false)
            }}
          />
        </Field>
        <SaveRow busy={busy} saved={saved} onClick={() => void save()} />
      </CardContent>
    </Card>
  )
}

function AttributesCard({ brand, design, onChanged }: EditCardProps): JSX.Element {
  const a = design.attributes
  const [productType, setProductType] = useState(a?.product_type ?? '')
  const [personalisationType, setPersonalisationType] = useState(a?.personalisation_type ?? '')
  const [colourCount, setColourCount] = useState(a?.colour_count ? String(a.colour_count) : '')
  const [addOns, setAddOns] = useState(a?.add_ons?.join(', ') ?? '')
  const [packagingType, setPackagingType] = useState(a?.packaging_type ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function dirtied<T>(setter: (v: T) => void): (v: T) => void {
    return v => {
      setter(v)
      setSaved(false)
    }
  }

  async function save(): Promise<void> {
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await editAttributesForBrand(brand, design.id, {
      product_type: productType.trim() || undefined,
      personalisation_type: personalisationType.trim() || undefined,
      colour_count: colourCount.trim() ? Number(colourCount) : undefined,
      add_ons: addOns
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      packaging_type: packagingType.trim() || undefined,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the attributes.')
      return
    }
    setSaved(true)
    onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product attributes</CardTitle>
        <CardDescription>Upload metadata used for costing and catalog context.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product type" htmlFor="attr-product-type" hint="Optional">
            <Input
              id="attr-product-type"
              value={productType}
              onChange={e => dirtied(setProductType)(e.target.value)}
            />
          </Field>
          <Field label="Personalisation type" htmlFor="attr-personalisation" hint="Optional">
            <Input
              id="attr-personalisation"
              value={personalisationType}
              onChange={e => dirtied(setPersonalisationType)(e.target.value)}
            />
          </Field>
          <Field label="Colour count" htmlFor="attr-colour-count" hint="1-20, optional">
            <Input
              id="attr-colour-count"
              type="number"
              min={1}
              max={20}
              value={colourCount}
              onChange={e => dirtied(setColourCount)(e.target.value)}
            />
          </Field>
          <Field label="Packaging type" htmlFor="attr-packaging" hint="Optional">
            <Input
              id="attr-packaging"
              value={packagingType}
              onChange={e => dirtied(setPackagingType)(e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Add-ons"
          htmlFor="attr-add-ons"
          hint="Comma-separated, optional"
          error={error ?? undefined}
        >
          <Input
            id="attr-add-ons"
            value={addOns}
            onChange={e => dirtied(setAddOns)(e.target.value)}
          />
        </Field>
        <SaveRow busy={busy} saved={saved} onClick={() => void save()} />
      </CardContent>
    </Card>
  )
}
