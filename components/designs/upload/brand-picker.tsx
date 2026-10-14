import type { JSX } from 'react'

import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'

import type { BrandChoice } from './upload-schema'

interface BrandPickerProps {
  options: BrandChoice[]
  value: string
  onChange: (slug: string) => void
}

/** In the "all brands" view a design still belongs to one brand: pick it. */
export function BrandPicker({ options, value, onChange }: BrandPickerProps): JSX.Element {
  return (
    <Field label="Brand" htmlFor="target-brand" required hint="Which brand this design belongs to">
      <Select id="target-brand" value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </Select>
    </Field>
  )
}
