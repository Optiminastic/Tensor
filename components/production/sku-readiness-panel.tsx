'use client'

import { useEffect, useState, type JSX } from 'react'

import { loadSKUReadiness } from '@/app/dashboard/[brand]/production/design-fields-actions'
import type { SKUReadiness } from '@/lib/validators/preview-design'

interface SKUReadinessPanelProps {
  brand: string
  productCode: string
}

/**
 * What each child SKU still needs before an order can be made from it.
 *
 * The same questions an arriving order asks, asked now instead. Without this
 * the answer comes hours later, as a held job carrying a message written for
 * whoever wrote the renderer - "PWDH names no template for body" - which is
 * true, says nothing about what to go and do, and is attached to a customer's
 * order by the time anybody reads it.
 */
export function SKUReadinessPanel({ brand, productCode }: SKUReadinessPanelProps): JSX.Element {
  const [rows, setRows] = useState<SKUReadiness[]>([])
  const [error, setError] = useState('')

  // POLLED ONLY WHILE SOMETHING IS RENDERING, and this panel is why that
  // distinction matters: configuration does not change by itself, so a poll
  // that ran regardless would be a request every few seconds for a page
  // somebody left open. A render does finish on its own, and watching it is
  // the one reason to look again - the same rule model-generating-panel
  // follows for one job.
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    let live = true
    const read = (): void => {
      void loadSKUReadiness(brand, productCode).then(result => {
        if (!live) return
        if (!result.ok) {
          setError(result.error ?? 'Could not check these SKUs.')
          return
        }
        const next = result.data ?? []
        setRows(next)
        setRendering(next.some(r => r.rendering > 0))
      })
    }
    read()
    if (!rendering)
      return () => {
        live = false
      }
    const timer = setInterval(read, 5000)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [brand, productCode, rendering])

  if (error) return <p className="text-danger text-sm">{error}</p>
  if (rows.length === 0) {
    return <p className="text-subtle-foreground text-sm">No SKUs to check.</p>
  }

  const blocked = rows.filter(r => !r.ready)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {blocked.length === 0
          ? 'Every SKU can take an order.'
          : `${blocked.length} of ${rows.length} SKUs cannot take an order yet.`}
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map(row => (
          <ReadinessRow key={row.variant_id} row={row} />
        ))}
      </ul>
    </div>
  )
}

function ReadinessRow({ row }: { row: SKUReadiness }): JSX.Element {
  return (
    <li className="border-border/70 rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2.5">
        {/* A dot and a word, not colour alone: the state has to survive being
            read by somebody who cannot tell the two greens apart. */}
        <span
          aria-hidden
          className={`size-2 rounded-full ${row.ready ? 'bg-success' : 'bg-warning'}`}
        />
        <span className="font-mono text-sm whitespace-nowrap">{row.sku}</span>
        <span className="text-muted-foreground text-sm">{row.name}</span>
        {/* What is HAPPENING, beside what is configured. A SKU can be
            perfectly set up and still have nothing moving, and after setting
            a product up that is the question somebody actually has. */}
        {row.rendering > 0 ? (
          <span className="text-accent ml-auto text-xs whitespace-nowrap">
            Building {row.rendering === 1 ? 'a model' : `${row.rendering} models`}…
          </span>
        ) : null}
        <span
          className={`text-xs ${row.rendering > 0 ? '' : 'ml-auto'} ${
            row.ready ? 'text-success' : 'text-warning'
          }`}
        >
          {row.ready ? 'Ready' : 'Not ready'}
        </span>
      </div>

      {row.problems.length > 0 ? (
        <ul className="mt-1.5 flex flex-col gap-1">
          {row.problems.map(problem => (
            <li key={problem} className="text-warning text-xs">
              {problem}
            </li>
          ))}
        </ul>
      ) : null}

      {row.notes.length > 0 ? (
        <ul className="mt-1.5 flex flex-col gap-1">
          {row.notes.map(note => (
            <li key={note} className="text-subtle-foreground text-xs">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
