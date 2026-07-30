'use client'

import { useMemo, useState, type JSX } from 'react'

import { AddFilamentDialog } from '@/components/production/add-filament-dialog'
import { FilamentFilters } from '@/components/production/filament-filters'
import { FilamentTable } from '@/components/production/filament-table'
import { INITIAL_FILAMENTS } from '@/components/production/sample-data'
import type { FilamentRecord } from '@/components/production/types'

function uniqueSorted<T>(values: T[]): T[] {
  return Array.from(new Set(values)).sort()
}

interface FilamentFilterState {
  material: string
  color: string
  diameter: string
}

function matchesFilters(f: FilamentRecord, filters: FilamentFilterState): boolean {
  if (filters.material && f.material !== filters.material) return false
  if (filters.color && f.color !== filters.color) return false
  if (filters.diameter && f.diameterMm !== Number(filters.diameter)) return false
  return true
}

export function FilamentInventoryView(): JSX.Element {
  const [filaments, setFilaments] = useState<FilamentRecord[]>(INITIAL_FILAMENTS)
  const [material, setMaterial] = useState('')
  const [color, setColor] = useState('')
  const [diameter, setDiameter] = useState('')

  const materials = useMemo(() => uniqueSorted(filaments.map(f => f.material)), [filaments])
  const colors = useMemo(() => uniqueSorted(filaments.map(f => f.color)), [filaments])
  const diameters = useMemo(() => uniqueSorted(filaments.map(f => f.diameterMm)), [filaments])
  const filtered = filaments.filter(f => matchesFilters(f, { material, color, diameter }))

  function addFilament(filament: FilamentRecord): void {
    setFilaments(prev => [filament, ...prev])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">Filament Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Track stock by material, color and diameter.
          </p>
        </div>
        <AddFilamentDialog onAdd={addFilament} />
      </div>
      <FilamentFilters
        materials={materials}
        colors={colors}
        diameters={diameters}
        material={material}
        color={color}
        diameter={diameter}
        onMaterialChange={setMaterial}
        onColorChange={setColor}
        onDiameterChange={setDiameter}
      />
      <FilamentTable filaments={filtered} />
    </div>
  )
}
