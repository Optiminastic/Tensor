'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { advanceJobsAction } from '@/app/dashboard/[brand]/production/advance-actions'
import type { ProductionJob } from '@/lib/validators/production'
import type { AdvanceStation } from '@/lib/validators/production-advance'

/**
 * How long a row spends sliding out before the list is refetched.
 *
 * MATCHED TO THE CSS, and the reason the two are not independent: refreshing
 * early snaps the row away mid-slide, and refreshing late leaves a gap where a
 * finished row sits doing nothing. 300ms is long enough to read as movement
 * and short enough that a bench worker clicking through a tray never waits for
 * it.
 */
export const SLIDE_MS = 300

interface StationAdvance {
  /** Rows mid-animation. The table renders these translated and fading. */
  leaving: Set<string>
  selected: Set<string>
  busy: boolean
  error: string | null
  allSelected: boolean
  someSelected: boolean
  toggle: (jobId: string) => void
  toggleAll: () => void
  clear: () => void
  /** Moves one job on. */
  advanceOne: (jobId: string) => Promise<void>
  /** Moves the whole selection on. */
  advanceSelected: () => Promise<void>
}

/**
 * The arrow, the tick boxes and the slide-out, shared by all four stations.
 *
 * ONE HOOK RATHER THAN FOUR COPIES. The tables differ only in their columns;
 * the behaviour behind the arrow is identical, and four copies of it would
 * drift the moment one of them got a fix.
 *
 * THE ROW LEAVES BEFORE THE DATA DOES. The server is the source of truth, but
 * waiting for a refetch before anything moves makes the arrow feel broken on a
 * slow connection. So the row slides out immediately and the refresh follows;
 * if the server refuses, the refresh puts it back and the error says why.
 */
export function useStationAdvance(
  brand: string,
  station: AdvanceStation,
  jobs: ProductionJob[],
): StationAdvance {
  const router = useRouter()
  const [leaving, setLeaving] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleIds = useMemo(() => jobs.map(job => job.id), [jobs])
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggle = useCallback((jobId: string) => {
    setSelected(current => {
      const next = new Set(current)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    // SELECTS WHAT IS ON SCREEN, not the whole queue. The page filters by
    // search and date, and "select all" quietly including rows somebody has
    // filtered out is how a tray of twenty becomes two hundred.
    setSelected(current => {
      const everyVisible = visibleIds.length > 0 && visibleIds.every(id => current.has(id))
      return everyVisible ? new Set() : new Set(visibleIds)
    })
  }, [visibleIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const run = useCallback(
    async (jobIds: string[]) => {
      if (jobIds.length === 0) return
      setBusy(true)
      setError(null)
      setLeaving(new Set(jobIds))

      const result = await advanceJobsAction({ brand, station, jobIds })

      if (!result.ok || !result.data) {
        // Put them back: nothing moved, and a row that slid away while the
        // server refused would be a lie told smoothly.
        setLeaving(new Set())
        setBusy(false)
        setError(result.error ?? 'Those jobs could not be moved on.')
        return
      }

      const { moved, skipped, failed, detail } = result.data
      if (failed > 0) {
        setError(
          detail ||
            `${failed} ${failed === 1 ? 'job' : 'jobs'} could not be moved on and are still here.`,
        )
      } else if (moved === 0 && skipped > 0) {
        // Worth saying rather than looking like nothing happened: somebody
        // else got there first.
        setError('Those were already moved on by somebody else.')
      }

      // Let the slide finish before the list is replaced underneath it.
      window.setTimeout(() => {
        setLeaving(new Set())
        setSelected(new Set())
        setBusy(false)
        router.refresh()
      }, SLIDE_MS)
    },
    [brand, station, router],
  )

  const advanceOne = useCallback((jobId: string) => run([jobId]), [run])
  const advanceSelected = useCallback(
    () => run(visibleIds.filter(id => selected.has(id))),
    [run, visibleIds, selected],
  )

  return {
    leaving,
    selected,
    busy,
    error,
    allSelected,
    someSelected,
    toggle,
    toggleAll,
    clear,
    advanceOne,
    advanceSelected,
  }
}
