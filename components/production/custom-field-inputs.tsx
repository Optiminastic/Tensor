'use client'

import type { JSX } from 'react'

import { useInventoryColumns } from '@/components/production/inventory-columns-context'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { InventoryShelf } from '@/lib/validators/inventory-columns'

interface CustomFieldInputsProps {
  shelf: InventoryShelf
  values: Record<string, string>
  onChange: (column: string, value: string) => void
  disabled?: boolean
}

/** One input per custom column of the shelf, inside an Add or Edit form. */
export function CustomFieldInputs({
  shelf,
  values,
  onChange,
  disabled,
}: CustomFieldInputsProps): JSX.Element | null {
  const columns = useInventoryColumns(shelf)
  if (columns.length === 0) return null
  return (
    <div className="border-border flex flex-col gap-3 border-t pt-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Custom columns
      </p>
      {columns.map(column => (
        <Field key={column.id} label={column.name} htmlFor={`custom-${shelf}-${column.id}`}>
          <Input
            id={`custom-${shelf}-${column.id}`}
            value={values[column.name] ?? ''}
            maxLength={500}
            disabled={disabled}
            onChange={e => onChange(column.name, e.target.value)}
          />
        </Field>
      ))}
    </div>
  )
}
