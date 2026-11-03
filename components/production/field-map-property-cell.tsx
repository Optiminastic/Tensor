'use client'

import { useState, type JSX } from 'react'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ObservedProperty } from '@/lib/validators/registry'

/** The dropdown entry that switches a row to a fixed value. Not a property. */
const FIXED = '__fixed__'
/** The dropdown entry that switches a row to a typed key. Not a property. */
const TYPED = '__typed__'

interface FieldMapPropertyCellProps {
  /** The fields this product's own recent orders carried. */
  properties: ObservedProperty[]
  /** The row as it stands: its key, and its fixed value if it has one. */
  row: { property_key: string; fixed_value: string }
  onChange: (patch: { property_key?: string; fixed_value?: string }) => void
}

/**
 * Where one mapped variable gets its value.
 *
 * Three answers, and the third is the point of this file.
 *
 *  1. A FIELD THE CUSTOMERS HAVE SENT, from the dropdown. Right almost
 *     always, and a dropdown rather than text because the storefront's
 *     "STEP 4-First Name-:" normalises to "step 4 first name" and a key typed
 *     one character wrong matches nothing in a way that looks exactly like an
 *     order carrying no personalisation at all.
 *  2. A FIXED VALUE. Not every variable a template needs is the customer's: a
 *     plank needs OUT_X=200 to come out the size it is sold at, and without
 *     it one real order rendered 377mm wide.
 *  3. A KEY TYPED BY HAND. The dropdown is built from THIS PRODUCT'S OWN
 *     ORDERS, so a product that has never sold offers an empty list - and
 *     until this existed that was a dead end: the only way to configure a new
 *     design was to sell one first, then come back. Typing is worse than
 *     picking and is offered second, below every real field, with the risk
 *     said out loud.
 */
export function FieldMapPropertyCell({
  properties,
  row,
  onChange,
}: FieldMapPropertyCellProps): JSX.Element {
  // An override, not the mode. The mode is read from the row on every render
  // so that removing a row above this one cannot leave the cell showing the
  // wrong control for the row that moved into its place; this only covers the
  // one state the row cannot express - "typing, nothing typed yet".
  const [wantsTyping, setWantsTyping] = useState(false)

  const fixed = row.fixed_value.trim() !== ''
  const unknown = row.property_key !== '' && !properties.some(p => p.key === row.property_key)
  const typing = !fixed && (unknown || wantsTyping)

  if (fixed) {
    return (
      <Cell label="Always">
        <Input
          value={row.fixed_value}
          onChange={e => onChange({ fixed_value: e.target.value })}
          placeholder="e.g. 200"
        />
      </Cell>
    )
  }

  if (typing) {
    return (
      <Cell label="Order field, typed">
        <Input
          value={row.property_key}
          autoFocus={wantsTyping && row.property_key === ''}
          onChange={e => onChange({ property_key: e.target.value })}
          placeholder="step 4 first name"
          // Lower-case and punctuation-free is the form that matches, so the
          // control shows the form that matches rather than accepting a
          // friendlier one and normalising it out of sight.
          className="font-mono text-sm"
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground self-start text-xs underline"
          onClick={() => {
            setWantsTyping(false)
            onChange({ property_key: '' })
          }}
        >
          Pick from the list instead
        </button>
      </Cell>
    )
  }

  return (
    <Cell label="Order field">
      <Select
        value={row.property_key}
        onChange={e => {
          const picked = e.target.value
          if (picked === FIXED) {
            // A single space, so isFixed reads the row as fixed before the
            // person has typed the value. An empty string would read as an
            // ordinary unmapped row and the control would flip straight back.
            onChange({ property_key: '', fixed_value: ' ' })
            return
          }
          if (picked === TYPED) {
            setWantsTyping(true)
            onChange({ property_key: '' })
            return
          }
          onChange({ property_key: picked })
        }}
      >
        <option value="">Choose…</option>
        {properties.map(p => (
          <option key={p.key} value={p.key}>
            {p.label} · {p.orders} order{p.orders === 1 ? '' : 's'}
          </option>
        ))}
        <option value={FIXED}>A fixed value…</option>
        {/* Last, under every real field. A typed key is the answer for a
            product with no orders yet, and the wrong answer for one that has
            them - the field is in the list above, spelled the way that
            matches. */}
        <option value={TYPED}>Type a field name…</option>
      </Select>
    </Cell>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="flex min-w-48 flex-1 flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </label>
  )
}
