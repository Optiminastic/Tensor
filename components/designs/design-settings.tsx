'use client'

import { useState, type JSX } from 'react'

import { renameDesignForBrand } from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { DesignDetail } from '@/lib/validators/designs'

import { ArchiveDesignButton } from './archive-design-button'
import { DeleteDesignButton } from './delete-design-button'
import { DesignEditCards } from './design-settings-edit'
import { DesignSkuDialog } from './design-sku-dialog'
import { ProductDescriptionCard } from './product-description-card'

export interface DesignSettingsCaps {
  // design:update - covers rename, notes, attributes and the cover image.
  canEdit: boolean
  canManageSku: boolean
  canDelete: boolean
  // design:content - write the product marketing description (Marketing Head).
  canWriteContent: boolean
}

interface DesignSettingsProps {
  brand: string
  design: DesignDetail
  caps: DesignSettingsCaps
  onChanged: () => void
}

/** The design's Settings tab: rename it, manage its catalog SKU, and delete it.
 * Each control is gated by the same permission the backend enforces. */
export function DesignSettings({
  brand,
  design,
  caps,
  onChanged,
}: DesignSettingsProps): JSX.Element {
  const nothing = !caps.canEdit && !caps.canManageSku && !caps.canDelete && !caps.canWriteContent
  return (
    <div className="flex flex-col gap-6">
      {caps.canWriteContent ? (
        <ProductDescriptionCard brand={brand} design={design} onChanged={onChanged} />
      ) : null}
      {caps.canEdit ? <RenameCard brand={brand} design={design} onChanged={onChanged} /> : null}
      {caps.canEdit ? (
        <DesignEditCards brand={brand} design={design} onChanged={onChanged} />
      ) : null}
      {caps.canManageSku ? <SkuCard brand={brand} design={design} onChanged={onChanged} /> : null}
      {caps.canDelete ? <ArchiveCard brand={brand} design={design} /> : null}
      {caps.canDelete ? <DangerCard brand={brand} design={design} /> : null}
      {nothing ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              You do not have permission to change this design&apos;s settings.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

interface CardProps {
  brand: string
  design: DesignDetail
  onChanged: () => void
}

function RenameCard({ brand, design, onChanged }: CardProps): JSX.Element {
  const [name, setName] = useState(design.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const dirty = name.trim().length > 0 && name.trim() !== design.name

  async function save(): Promise<void> {
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await renameDesignForBrand(brand, design.id, name)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not rename the design.')
      return
    }
    setSaved(true)
    onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name</CardTitle>
        <CardDescription>The design&apos;s display name across Tensor.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field label="Design name" htmlFor="design-name" error={error ?? undefined}>
          <Input
            id="design-name"
            value={name}
            maxLength={160}
            onChange={e => {
              setName(e.target.value)
              setSaved(false)
            }}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => void save()} disabled={busy || !dirty}>
            {busy ? 'Saving…' : 'Save name'}
          </Button>
          {saved ? <span className="text-success text-sm">Saved.</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function SkuCard({ brand, design, onChanged }: CardProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SKU</CardTitle>
        <CardDescription>
          The catalog code an incoming order resolves to this design.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-sm tabular-nums">
          {design.sku ? (
            <span className="text-foreground">{design.sku}</span>
          ) : (
            <span className="text-muted-foreground italic">not assigned</span>
          )}
        </span>
        <DesignSkuDialog
          brand={brand}
          designId={design.id}
          currentSku={design.sku ?? null}
          onSaved={onChanged}
        />
      </CardContent>
    </Card>
  )
}

function ArchiveCard({ brand, design }: { brand: string; design: DesignDetail }): JSX.Element {
  const archived = design.status === 'archived'
  return (
    <Card>
      <CardHeader>
        <CardTitle>{archived ? 'Restore design' : 'Archive design'}</CardTitle>
        <CardDescription>
          {archived
            ? 'This design is archived and hidden from the active lists. Restore it to bring it back into the pipeline.'
            : 'Hide this design from the active lists without deleting it. It moves to Archived and can be restored any time.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ArchiveDesignButton
          brand={brand}
          designId={design.id}
          name={design.name}
          archived={archived}
        />
      </CardContent>
    </Card>
  )
}

function DangerCard({ brand, design }: { brand: string; design: DesignDetail }): JSX.Element {
  return (
    <Card className="border-danger/40">
      <CardHeader>
        <CardTitle className="text-danger">Delete design</CardTitle>
        <CardDescription>
          Permanently removes this design and its slice, cost and review history. It does not remove
          a product already published to Shopify.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeleteDesignButton
          brand={brand}
          designId={design.id}
          name={design.name}
          variant="inline"
          redirectTo={`/dashboard/${brand}/designs`}
        />
      </CardContent>
    </Card>
  )
}
