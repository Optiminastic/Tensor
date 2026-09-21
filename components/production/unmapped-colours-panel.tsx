'use client'

import { useState, type JSX } from 'react'

import { addColourMapping } from '@/app/dashboard/[brand]/production/inventory/colour-map-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { UnmappedColour } from '@/lib/validators/colour-map'

interface UnmappedColoursPanelProps {
  brand: string
  unmapped: UnmappedColour[]
}

/**
 * The spools sitting in the printers that Tensor cannot name.
 *
 * This is the panel that makes the colour map fillable at all. An AMS reports a
 * colour only as a hex, and most of these spools are generic rather than Bambu,
 * so they appear in nobody's catalogue — without this list an operator would be
 * copying hex codes out of BambuBuddy by hand.
 *
 * Each row carries a suggested name from the closest colour Tensor already
 * knows, pre-filled into the field but never saved on its own. The suggestion
 * is a nearest-colour guess, and a guess is exactly what the map exists to
 * replace: the operator is the one who can see which spool is actually loaded.
 */
export function UnmappedColoursPanel({
  brand,
  unmapped,
}: UnmappedColoursPanelProps): JSX.Element | null {
  if (unmapped.length === 0) return null

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">
          {unmapped.length} loaded {unmapped.length === 1 ? 'spool' : 'spools'} Tensor cannot name
        </h2>
        <p className="text-muted-foreground text-xs">
          These colours are in the printers right now. Until each one is named, Tensor cannot tell
          which machine holds a bed&rsquo;s colours, and a plate may ask for a colour nobody has
          loaded.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {unmapped.map(colour => (
          <UnmappedRow key={colour.hex} brand={brand} colour={colour} />
        ))}
      </div>
    </Card>
  )
}

function UnmappedRow({ brand, colour }: { brand: string; colour: UnmappedColour }): JSX.Element {
  const [name, setName] = useState(colour.nearest_known_name)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    if (!name.trim()) {
      setError('Name the colour first.')
      return
    }
    setPending(true)
    setError(null)
    const res = await addColourMapping(brand, {
      colour_name: name.trim(),
      hex: colour.hex,
      is_primary: true,
    })
    setPending(false)
    if (!res.ok) setError(res.error ?? 'Could not record that colour.')
    // On success the row disappears: the server action revalidates, and this
    // hex is no longer unmapped.
  }

  return (
    <div className="border-border flex flex-wrap items-center gap-3 rounded-md border p-2">
      <span
        aria-hidden
        className="border-border size-6 shrink-0 rounded-full border"
        style={{ backgroundColor: colour.hex }}
      />
      <span className="font-mono text-xs tabular-nums">{colour.hex}</span>
      <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
        in {colour.machines.join(', ')}
      </span>
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Our name for it"
        aria-label={`Name for ${colour.hex}`}
        className="w-40"
      />
      <Button size="sm" disabled={pending} onClick={() => void save()}>
        {pending ? 'Saving…' : 'This is ours'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger w-full text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
