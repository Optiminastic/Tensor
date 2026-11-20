'use client'

import { Fragment, useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { showPresetValue, type SlicingProfile } from '@/lib/validators/slicing-profiles'

import { SlicingProfileEditor } from './slicing-profile-editor'

interface SlicingProfileTableProps {
  profiles: SlicingProfile[]
  onSaved: (profile: SlicingProfile) => void
}

/** The settings shown per profile, as it slices: preset plus overrides. */
const COLUMNS = [
  { key: 'layer_height', label: 'Layer' },
  { key: 'wall_loops', label: 'Walls' },
  { key: 'sparse_infill_density', label: 'Infill' },
  { key: 'enable_support', label: 'Supports' },
] as const

function cellValue(profile: SlicingProfile, key: string): string {
  const v = showPresetValue(profile.settings[key])
  if (key === 'enable_support') return v === '1' ? 'On' : v === '0' ? 'Off' : '—'
  return v === '' ? '—' : v
}

/** One row per profile; Edit opens its settings beneath the row. */
export function SlicingProfileTable({ profiles, onSaved }: SlicingProfileTableProps): JSX.Element {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Table dense>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Profile</TableHeaderCell>
          <TableHeaderCell>Class</TableHeaderCell>
          {COLUMNS.map(c => (
            <TableHeaderCell key={c.key}>{c.label}</TableHeaderCell>
          ))}
          <TableHeaderCell>Version</TableHeaderCell>
          <TableHeaderCell>
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {profiles.map(p => (
          <Fragment key={p.id}>
            <TableRow>
              <TableCell>
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground block text-xs">
                  {p.process_preset_name} · {p.filament_preset_name}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs">{p.machine_family}</TableCell>
              {COLUMNS.map(c => (
                <TableCell key={c.key} className="font-mono tabular-nums">
                  {cellValue(p, c.key)}
                  {c.key in p.overrides ? (
                    <span className="text-muted-foreground ml-1 text-xs" title="Changed in Tensor">
                      <span aria-hidden>●</span>
                      <span className="sr-only">changed in Tensor</span>
                    </span>
                  ) : null}
                </TableCell>
              ))}
              <TableCell className="font-mono tabular-nums">v{p.version}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen(open === p.id ? null : p.id)}
                >
                  {open === p.id ? 'Close' : 'Edit'}
                </Button>
              </TableCell>
            </TableRow>
            {open === p.id ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 4}>
                  <SlicingProfileEditor
                    profile={p}
                    onSaved={onSaved}
                    onClose={() => setOpen(null)}
                  />
                </TableCell>
              </TableRow>
            ) : null}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  )
}
