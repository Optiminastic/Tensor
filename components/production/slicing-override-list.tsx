'use client'

import type { JSX } from 'react'

import { Button } from '@/components/ui/button'
import { type PresetValue, showPresetValue } from '@/lib/validators/slicing-profiles'

interface OverrideListProps {
  overrides: Record<string, PresetValue>
  busy: boolean
  onReset: (key: string) => void
}

/** What this profile changes from BambuBuddy's preset, each undoable on its own. */
export function OverrideList({ overrides, busy, onReset }: OverrideListProps): JSX.Element {
  const keys = Object.keys(overrides).sort()
  if (keys.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No changes yet. This profile slices exactly as BambuBuddy&rsquo;s preset does.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {keys.map(k => (
        <li key={k} className="flex items-center gap-3">
          <code className="font-mono text-xs">{k}</code>
          <span className="font-mono text-xs tabular-nums">{showPresetValue(overrides[k])}</span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onReset(k)}>
            Reset to preset
          </Button>
        </li>
      ))}
    </ul>
  )
}
