'use client'

import { Star, Trash2 } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'

import {
  makeColourPrimary,
  removeColourMapping,
} from '@/app/dashboard/[brand]/production/inventory/colour-map-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { ColourMapEntry } from '@/lib/validators/colour-map'

interface ColourMapTableProps {
  brand: string
  entries: ColourMapEntry[]
}

/**
 * What each colour name means to the printers, one row per confirmed spool.
 *
 * A name deliberately holds several hexes. Thirteen printers do not agree on
 * blue — the spools are generic, so each reports its own value — and a single
 * hex per name would make the queue check reject every machine holding the
 * other one. The primary is the swatch a model is rendered in; the rest are
 * alternatives a machine may legitimately have loaded.
 */
export function ColourMapTable({ brand, entries }: ColourMapTableProps): JSX.Element {
  const grouped = useMemo(() => {
    const byName = new Map<string, ColourMapEntry[]>()
    for (const entry of entries) {
      const list = byName.get(entry.colour_name) ?? []
      list.push(entry)
      byName.set(entry.colour_name, list)
    }
    // Primary first inside each colour, then by hex, so the swatch a plank
    // prints in is always the top row of its group.
    for (const list of byName.values()) {
      list.sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
        return a.hex.localeCompare(b.hex)
      })
    }
    return [...byName.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entries])

  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          No colours mapped yet. Name the loaded spools above, and Tensor can start matching beds to
          machines.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Colour</TableHeaderCell>
            <TableHeaderCell>Value</TableHeaderCell>
            <TableHeaderCell>Renders as</TableHeaderCell>
            <TableHeaderCell className="text-right">
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {grouped.map(([name, list]) =>
            list.map((entry, i) => (
              <ColourMapRow
                key={entry.id}
                brand={brand}
                entry={entry}
                // The name is printed once per group; the alternatives below it
                // are the same colour, and repeating it reads as four colours.
                showName={i === 0}
                name={name}
              />
            )),
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

interface ColourMapRowProps {
  brand: string
  entry: ColourMapEntry
  showName: boolean
  name: string
}

function ColourMapRow({ brand, entry, showName, name }: ColourMapRowProps): JSX.Element {
  const [pending, setPending] = useState<'primary' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function promote(): Promise<void> {
    setPending('primary')
    setError(null)
    const res = await makeColourPrimary(brand, entry.id)
    setPending(null)
    if (!res.ok) setError(res.error ?? 'Could not change the primary colour.')
  }

  async function remove(): Promise<void> {
    setPending('delete')
    setError(null)
    const res = await removeColourMapping(brand, entry.id)
    setPending(null)
    if (!res.ok) setError(res.error ?? 'Could not remove that colour.')
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{showName ? name : ''}</TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="border-border size-3.5 shrink-0 rounded-full border"
            style={{ backgroundColor: entry.hex }}
          />
          <span className="font-mono text-xs tabular-nums">{entry.hex}</span>
        </span>
        {error ? (
          <p role="alert" className="text-danger mt-1 text-xs">
            {error}
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        {entry.is_primary ? (
          <span className="text-muted-foreground text-xs">this one</span>
        ) : (
          <span className="text-subtle-foreground text-xs">alternative</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {entry.is_primary ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending !== null}
              onClick={() => void promote()}
              title="Render this colour's models in this value"
            >
              <Star className="size-3.5" aria-hidden />
              {pending === 'primary' ? 'Setting…' : 'Use this'}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending !== null}
            onClick={() => void remove()}
            aria-label={`Remove ${entry.hex} from ${name}`}
            className="text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
