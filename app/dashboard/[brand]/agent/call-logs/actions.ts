'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import type { Transcript } from '@/lib/validators/call-logs'
import { CallLogsServiceError, getTranscript } from '@/services/call-logs.service'

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

/**
 * Fetches one call's transcript, on demand.
 *
 * On demand rather than with the listing: a month of calls is a month of
 * transcripts, one request each, and nobody reads more than the two or three
 * they open. The list stays one request; a transcript costs one more only when
 * somebody asks for it.
 */
export async function loadTranscriptAction(
  brand: string,
  interactionId: string,
): Promise<ActionResult<Transcript>> {
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  }
  try {
    return { ok: true, data: await getTranscript(token, brand, interactionId) }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof CallLogsServiceError ? err.message : 'Could not read that transcript.',
    }
  }
}
