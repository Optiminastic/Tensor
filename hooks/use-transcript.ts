'use client'

import { useEffect, useState } from 'react'

import { loadTranscriptAction } from '@/app/dashboard/[brand]/agent/actions'
import type { TranscriptTurn } from '@/lib/validators/call-logs'

interface TranscriptState {
  turns: TranscriptTurn[] | null
  error: string | null
  loading: boolean
}

/**
 * One call's transcript, fetched when a call is chosen and not before.
 *
 * An empty interaction id means no call is chosen, and costs nothing. A stale
 * answer - the reader moved to another call while this one was loading - is
 * dropped rather than shown under the wrong call.
 */
export function useTranscript(brand: string, interactionId: string): TranscriptState {
  const [state, setState] = useState<TranscriptState>({
    turns: null,
    error: null,
    loading: false,
  })

  useEffect(() => {
    if (!interactionId) {
      setState({ turns: null, error: null, loading: false })
      return
    }
    let live = true
    setState({ turns: null, error: null, loading: true })
    void loadTranscriptAction(brand, interactionId).then(result => {
      if (!live) return
      setState(
        result.ok && result.data
          ? { turns: result.data.turns, error: null, loading: false }
          : {
              turns: null,
              error: result.error ?? 'Could not read that transcript.',
              loading: false,
            },
      )
    })
    return () => {
      live = false
    }
  }, [brand, interactionId])

  return state
}
