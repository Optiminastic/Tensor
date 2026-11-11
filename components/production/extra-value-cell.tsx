'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent } from 'react'

import { setInventoryExtra } from '@/app/dashboard/[brand]/production/inventory/inventory-columns-actions'
import { Input } from '@/components/ui/input'
import { TableCell } from '@/components/ui/table'
import type { InventoryShelf } from '@/lib/validators/inventory-columns'

interface ExtraValueCellProps {
  brand: string
  shelf: InventoryShelf
  rowId: string
  column: string
  value: string
}

/**
 * One row's value for one custom column, edited in place.
 *
 * Click to edit; Enter or leaving the field saves, Escape cancels. An empty
 * value clears it.
 */
export function ExtraValueCell({
  brand,
  shelf,
  rowId,
  column,
  value,
}: ExtraValueCellProps): JSX.Element {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(): Promise<void> {
    setEditing(false)
    if (draft.trim() === value) return
    setSaving(true)
    const res = await setInventoryExtra(brand, { shelf, rowId, column, value: draft.trim() })
    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the value.')
      setDraft(value)
      return
    }
    setError(null)
    router.refresh()
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  return (
    <TableCell className="max-w-56 py-2 text-sm">
      {editing ? (
        <Input
          autoFocus
          value={draft}
          maxLength={500}
          aria-label={column}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={onKey}
          className="h-8"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(true)
          }}
          className="hover:bg-surface-muted block w-full truncate rounded px-1 py-0.5 text-left"
          title={error ?? (value || `Add ${column}`)}
        >
          {saving ? (
            <span className="text-muted-foreground">Saving…</span>
          ) : value ? (
            value
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </button>
      )}
      {error ? (
        <p role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      ) : null}
    </TableCell>
  )
}
