import type { ChangeEvent, JSX } from 'react'

import { Select } from '@/components/ui/select'

interface FilamentFiltersProps {
  materials: string[]
  colors: string[]
  diameters: number[]
  material: string
  color: string
  diameter: string
  onMaterialChange: (value: string) => void
  onColorChange: (value: string) => void
  onDiameterChange: (value: string) => void
}

function changeHandler(
  setter: (value: string) => void,
): (event: ChangeEvent<HTMLSelectElement>) => void {
  return event => setter(event.target.value)
}

export function FilamentFilters({
  materials,
  colors,
  diameters,
  material,
  color,
  diameter,
  onMaterialChange,
  onColorChange,
  onDiameterChange,
}: FilamentFiltersProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={material} onChange={changeHandler(onMaterialChange)} className="w-44">
        <option value="">All materials</option>
        {materials.map(m => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
      <Select value={color} onChange={changeHandler(onColorChange)} className="w-44">
        <option value="">All colors</option>
        {colors.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select value={diameter} onChange={changeHandler(onDiameterChange)} className="w-44">
        <option value="">All diameters</option>
        {diameters.map(d => (
          <option key={d} value={String(d)}>
            {d.toFixed(2)} mm
          </option>
        ))}
      </Select>
    </div>
  )
}
