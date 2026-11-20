'use client'

import { useState, type JSX } from 'react'

import { saveSlicingOverridesAction } from '@/app/dashboard/[brand]/production/slicing-profile-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  type PresetValue,
  showPresetValue,
  type SlicingProfile,
} from '@/lib/validators/slicing-profiles'

import { OverrideList } from './slicing-override-list'

interface SlicingProfileEditorProps {
  profile: SlicingProfile
  onSaved: (profile: SlicingProfile) => void
  onClose: () => void
}

/** The settings edited by name. Everything else is reached as a raw override. */
const FIELDS = [
  { key: 'layer_height', label: 'Layer height (mm)', hint: '0.28' },
  { key: 'wall_loops', label: 'Walls', hint: '2' },
  { key: 'sparse_infill_density', label: 'Infill', hint: '15%' },
] as const

/**
 * One profile's overrides on top of its imported process preset.
 *
 * Saves the whole set: a field changed from what the profile slices with today
 * becomes an override, and Reset drops one so the imported value applies
 * again. The backend refuses a key the process does not have, and the keys
 * Tensor sets per bed (nozzle map, prime tower, colours).
 */
export function SlicingProfileEditor({
  profile,
  onSaved,
  onClose,
}: SlicingProfileEditorProps): JSX.Element {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(profile))
  const [support, setSupport] = useState(showPresetValue(profile.settings.enable_support) === '1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(overrides: Record<string, PresetValue>): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await saveSlicingOverridesAction({ id: profile.id, overrides })
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not save the settings.')
      return
    }
    onSaved(res.data)
  }

  function changed(): Record<string, PresetValue> {
    const next: Record<string, PresetValue> = { ...profile.overrides }
    for (const f of FIELDS) {
      const v = values[f.key]?.trim() ?? ''
      if (v !== '' && v !== showPresetValue(profile.settings[f.key])) next[f.key] = v
    }
    const supportNow = support ? '1' : '0'
    if (supportNow !== showPresetValue(profile.settings.enable_support)) {
      next.enable_support = supportNow
    }
    return next
  }

  function reset(key: string): void {
    const next = { ...profile.overrides }
    delete next[key]
    void save(next)
  }

  return (
    <div className="bg-surface-muted flex flex-col gap-4 rounded-2xl p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {FIELDS.map(f => (
          <label key={f.key} className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <Input
              value={values[f.key] ?? ''}
              placeholder={f.hint}
              className="font-mono tabular-nums"
              disabled={busy}
              onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground text-xs">Supports</span>
          <span className="flex h-9 items-center gap-2">
            <Switch checked={support} disabled={busy} onCheckedChange={setSupport} />
            {support ? 'On' : 'Off'}
          </span>
        </label>
      </div>

      <OverrideList overrides={profile.overrides} busy={busy} onReset={reset} />

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => void save(changed())}>
          {busy ? 'Saving…' : 'Save settings'}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function initialValues(profile: SlicingProfile): Record<string, string> {
  return Object.fromEntries(FIELDS.map(f => [f.key, showPresetValue(profile.settings[f.key])]))
}
