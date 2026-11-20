'use client'

import { useCallback, useEffect, useState, type JSX } from 'react'

import {
  importSlicingProfilesAction,
  loadSlicingProfiles,
} from '@/app/dashboard/[brand]/production/slicing-profile-actions'
import { Button } from '@/components/ui/button'
import type { SlicingProfile, SlicingProfileImport } from '@/lib/validators/slicing-profiles'

import { ImportResult } from './slicing-import-result'
import { SlicingProfileTable } from './slicing-profile-table'

/**
 * Tensor's own copy of each BambuBuddy pipeline's slicer settings.
 *
 * The SKU mappings above still choose a pipeline, and a pipeline reaches its
 * profile here by id. Nothing prints from these yet: beds slice on BambuBuddy
 * until dispatch is switched to Tensor's own slice worker, which is why the
 * blurb says so rather than letting an edit look like it changed a print.
 */
export function SlicingProfilesPanel(): JSX.Element {
  const [profiles, setProfiles] = useState<SlicingProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SlicingProfileImport | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    const res = await loadSlicingProfiles()
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not read the slicing profiles.')
      return
    }
    setProfiles(res.data)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function runImport(): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await importSlicingProfilesAction()
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not import the profiles from BambuBuddy.')
      return
    }
    setResult(res.data)
    await refresh()
  }

  function replace(updated: SlicingProfile): void {
    setProfiles(list => list?.map(p => (p.id === updated.id ? updated : p)) ?? null)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex max-w-prose flex-col gap-0.5">
          <h3 className="text-sm font-medium">Slicing profiles</h3>
          <p className="text-muted-foreground text-xs">
            Tensor&rsquo;s copy of each pipeline&rsquo;s printer, process and filament settings.
            Beds still slice on BambuBuddy; these take over once Tensor slices its own files.
          </p>
        </div>
        <Button size="sm" disabled={busy} onClick={() => void runImport()}>
          {busy ? 'Importing…' : 'Import from BambuBuddy'}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {result ? <ImportResult result={result} /> : null}

      {profiles === null && error === null ? (
        <p className="text-muted-foreground text-sm">Reading the profiles…</p>
      ) : null}
      {profiles !== null && profiles.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No profiles yet. Import them to copy each BambuBuddy pipeline&rsquo;s settings into
          Tensor.
        </p>
      ) : null}
      {profiles !== null && profiles.length > 0 ? (
        <SlicingProfileTable profiles={profiles} onSaved={replace} />
      ) : null}
    </section>
  )
}
