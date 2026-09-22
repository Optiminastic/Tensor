'use client'

import { Check, Pencil, RefreshCw, Trash2, X } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'

import {
  addColourMapping,
  editColourMapping,
  fetchLoadedColours,
  removeColourMapping,
} from '@/app/dashboard/[brand]/production/inventory/colour-map-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { ColourMapEntry, LoadedColour } from '@/lib/validators/colour-map'

interface LoadedColoursPanelProps {
  brand: string
  loaded: LoadedColour[]
  /** Every colour already recorded, to offer as choices rather than spelling. */
  entries: ColourMapEntry[]
}

/**
 * The spools sitting in the printers, and what the shop calls each one.
 *
 * This is the panel that makes the colour map fillable at all. An AMS reports a
 * colour only as a hex, and most of these spools are generic rather than Bambu,
 * so they appear in nobody's catalogue — without this list an operator would be
 * copying hex codes out of BambuBuddy by hand.
 *
 * It lists spools already named as well as unnamed ones. Showing only the
 * unnamed made the panel empty itself as it was filled, which read as progress
 * and hid the one thing still worth doing: a spool named GOLD in haste has to
 * be nameable as something else, and "this brown one is actually our gold" is a
 * judgement people change their minds about.
 *
 * A name can be picked from the colours already in use or typed fresh. Picking
 * is what makes "treat this spool as GOLD" one click instead of an exercise in
 * spelling GOLD the same way twice.
 */
export function LoadedColoursPanel({
  brand,
  loaded,
  entries,
}: LoadedColoursPanelProps): JSX.Element | null {
  const names = useMemo(
    () => [...new Set(entries.map(e => e.colour_name))].sort((a, b) => a.localeCompare(b)),
    [entries],
  )

  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  // Hexes that were not here before the last Fetch. Marked rather than filtered:
  // a new spool belongs in the list beside the others, and pulling it out into
  // its own section would mean naming it somewhere different from everything
  // else.
  const [justAppeared, setJustAppeared] = useState<string[]>([])
  const [checked, setChecked] = useState(false)

  // The list itself stays a prop. Every action here revalidates, so the server
  // component re-renders with fresh data - and holding a copy in state would
  // mean a spool named through this panel kept showing as unnamed, because the
  // copy was seeded once and never told.
  async function fetchFromPrinters(): Promise<void> {
    setFetching(true)
    setFetchError('')
    const before = new Set(loaded.map(s => s.hex))

    const res = await fetchLoadedColours(brand)
    setFetching(false)
    if (!res.ok || !res.data) {
      setFetchError(res.error ?? 'Could not read the printers.')
      return
    }
    setJustAppeared(res.data.filter(s => !before.has(s.hex)).map(s => s.hex))
    setChecked(true)
  }

  if (loaded.length === 0 && !checked) return null

  const spools = loaded
  const unnamed = spools.filter(c => c.mapped_as === '').length

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">
            {spools.length} {spools.length === 1 ? 'spool' : 'spools'} loaded across the fleet
          </h2>
          <p className="text-muted-foreground text-xs">
            {unnamed > 0
              ? `${unnamed} of them Tensor cannot name yet. Until each is named, a bed in that colour cannot be queued — Tensor will not guess which spool is which.`
              : 'All named. Change any of them if a spool was called the wrong thing.'}
          </p>
        </div>
        {/* This list is a mirror the fleet sync refreshes every minute, which is
            the wrong speed for somebody who has just walked over and changed a
            spool: they come back, see the old colour, and cannot tell whether
            Tensor is behind or the AMS missed the swap. This goes and asks. */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void fetchFromPrinters()}
          disabled={fetching}
          title="Re-read every printer's AMS and list what is loaded now"
        >
          <RefreshCw className={`size-3.5 ${fetching ? 'animate-spin' : ''}`} aria-hidden />
          {fetching ? 'Reading printers…' : 'Fetch from printers'}
        </Button>
      </div>

      {fetchError ? (
        <p role="alert" className="text-danger text-xs">
          {fetchError}
        </p>
      ) : null}
      {checked && !fetchError ? (
        <p className="text-muted-foreground text-xs" role="status">
          {justAppeared.length > 0
            ? `${justAppeared.length} new ${justAppeared.length === 1 ? 'colour' : 'colours'} since last time — marked below. Name ${justAppeared.length === 1 ? 'it' : 'them'} and beds in that colour can be queued.`
            : 'Nothing new — the printers are holding the colours already listed.'}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {spools.map(colour => (
          <LoadedRow
            key={colour.hex}
            brand={brand}
            colour={colour}
            names={names}
            isNew={justAppeared.includes(colour.hex)}
          />
        ))}
      </div>
      {/* The list above is what the printers hold. A colour can also be
          recorded for a spool that is not in a machine right now — a shelf
          spool, or one that will be loaded later — which nothing above can
          express, because it only knows what the AMS reported. */}
      <CustomMappingForm brand={brand} names={names} />
    </Card>
  )
}

interface LoadedRowProps {
  brand: string
  colour: LoadedColour
  names: string[]
  /** Appeared in the printers only on the last Fetch. */
  isNew: boolean
}

function LoadedRow({ brand, colour, names, isNew }: LoadedRowProps): JSX.Element {
  const mapped = colour.mapped_as !== ''
  const [editing, setEditing] = useState(!mapped)
  // The manufacturer's own name for this exact hex is the best starting point
  // there is; the nearest colour Tensor knows is the fallback when the spool is
  // generic, which most here are.
  const [name, setName] = useState(
    mapped ? colour.mapped_as : colour.catalogue_name || colour.nearest_known_name,
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function save(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name the colour first.')
      return
    }
    setPending(true)
    setError('')

    // Already recorded: move this spool to the colour now named, keeping the
    // row so its history and its note survive the correction. Never recorded:
    // add it. The distinction is the entry id, not the name.
    const res = colour.entry_id
      ? await editColourMapping(brand, colour.entry_id, { colour_name: trimmed })
      : await addColourMapping(brand, { colour_name: trimmed, hex: colour.hex, is_primary: true })

    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record that colour.')
      return
    }
    // The server action revalidates, so this row comes back named.
    setEditing(false)
  }

  async function unname(): Promise<void> {
    if (!colour.entry_id) return
    setPending(true)
    setError('')
    const res = await removeColourMapping(brand, colour.entry_id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove that colour.')
      return
    }
    setEditing(true)
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-md border p-2 ${
        isNew ? 'border-accent bg-accent/5' : 'border-border'
      }`}
    >
      <span
        aria-hidden
        className="border-border size-6 shrink-0 rounded-full border"
        style={{ backgroundColor: colour.hex }}
      />
      <span className="font-mono text-xs tabular-nums">{colour.hex}</span>
      {isNew ? (
        <span className="text-accent text-[10px] font-medium tracking-wide uppercase">New</span>
      ) : null}
      <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
        in {colour.machines.join(', ')}
      </span>

      {editing ? (
        <>
          {/* Where the suggested name came from. Worth the room: "Bambu Lab
              calls this Latte Brown" is a fact somebody can act on, and it is
              the difference between accepting a suggestion and guessing. */}
          {!mapped && colour.catalogue_name ? (
            <span className="text-muted-foreground w-full text-xs">
              {colour.catalogue_brand || 'BambuBuddy'} calls this{' '}
              <span className="font-medium">{colour.catalogue_name}</span>
            </span>
          ) : null}
          <ColourNameInput value={name} onChange={setName} names={names} hex={colour.hex} />
          <Button size="sm" disabled={pending} onClick={() => void save()}>
            {pending ? 'Saving…' : mapped ? 'Save' : 'This is ours'}
          </Button>
          {mapped ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setName(colour.mapped_as)
                setError('')
                setEditing(false)
              }}
              aria-label="Stop editing"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <span className="flex items-center gap-2 text-xs">
            <span className="font-medium">{colour.mapped_as}</span>
            {colour.is_primary ? (
              <span className="text-subtle-foreground">prints as this</span>
            ) : (
              <span className="text-subtle-foreground">alternative</span>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setEditing(true)}
            aria-label={`Change what ${colour.hex} is called`}
          >
            <Pencil className="size-3.5" aria-hidden />
            Rename
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => void unname()}
            aria-label={`Forget what ${colour.hex} is called`}
            className="text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </>
      )}

      {error ? (
        <p role="alert" className="text-danger w-full text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface ColourNameInputProps {
  value: string
  onChange: (next: string) => void
  names: string[]
  hex: string
}

/**
 * A name, chosen from the colours already in use or typed fresh.
 *
 * A datalist rather than a select: the shop's colours are the common answer and
 * ought to be one click, but the first spool of a new colour has no entry to
 * pick and must still be nameable. A select would make that case impossible and
 * a plain input makes the common case a spelling test — BLUE and Blue are the
 * same colour, and only the backend knows that.
 */
function ColourNameInput({ value, onChange, names, hex }: ColourNameInputProps): JSX.Element {
  const listId = `colour-names-${hex.replace('#', '')}`
  return (
    <>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Our name for it"
        aria-label={`Name for ${hex}`}
        list={listId}
        className="w-40"
      />
      <datalist id={listId}>
        {names.map(n => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </>
  )
}

/**
 * Recording a spool that is not in a printer right now.
 *
 * The list above can only show what an AMS reported, so a spool on the shelf —
 * or one a bed will need before anybody loads it — has no row to fill in. This
 * is the way to say "when you see this hex, it is our TEAL" ahead of time.
 */
function CustomMappingForm({ brand, names }: { brand: string; names: string[] }): JSX.Element {
  const [name, setName] = useState('')
  const [hex, setHex] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function save(): Promise<void> {
    setPending(true)
    setError('')
    setDone(false)
    const res = await addColourMapping(brand, {
      colour_name: name.trim(),
      hex: hex.trim(),
      // An alternative unless this colour has nothing yet, which the backend
      // decides - it is the only side that knows what is already recorded.
      is_primary: false,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record that colour.')
      return
    }
    setName('')
    setHex('')
    setDone(true)
  }

  return (
    <div className="border-border flex flex-col gap-2 border-t pt-3">
      <p className="text-subtle-foreground text-[10px] tracking-wide uppercase">
        Add a colour by hand
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ColourNameInput value={name} onChange={setName} names={names} hex="custom" />
        <span
          aria-hidden
          className="border-border size-6 shrink-0 rounded-full border"
          // Only once it is a full hex, so the swatch does not flash colours
          // while somebody is halfway through typing one.
          style={{
            backgroundColor: /^#?[0-9a-fA-F]{6}$/.test(hex.trim()) ? hex.trim() : undefined,
          }}
        />
        <Input
          value={hex}
          onChange={e => setHex(e.target.value)}
          placeholder="#2850E0"
          aria-label="Colour value"
          className="w-32 font-mono text-xs"
        />
        <Button
          size="sm"
          disabled={pending || !name.trim() || !hex.trim()}
          onClick={() => void save()}
        >
          {pending ? 'Saving…' : 'Record it'}
        </Button>
        {done ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Check className="size-3.5" aria-hidden />
            Saved
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
