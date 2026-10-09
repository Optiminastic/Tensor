'use server'

import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { type VoiceCallResult, VoiceCallSchema } from '@/lib/validators/voice-calls'
import { VoiceCallsServiceError, placeVoiceCall } from '@/services/voice-calls.service'

const log = createLogger('AgentCallActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(error: unknown): string {
  if (error instanceof VoiceCallsServiceError) return error.message
  log.error({ err: error }, 'Unexpected error placing a call')
  return 'Something went wrong. Please try again.'
}

// A server action's arguments are client-controlled, so the token never comes
// from them.
async function resolveToken(): Promise<{ token?: string; error?: string }> {
  const requestHeaders = await headers()
  const token = await auth.api.getToken({ headers: requestHeaders })
  if (!token?.token) return { error: 'Could not mint an access token. Sign in again.' }
  return { token: token.token }
}

/**
 * Places one real phone call to one person.
 *
 * Shared by the Test call page and the Call button on an abandoned checkout,
 * because they are the same act: a human decided to ring somebody, and the
 * only difference is whether the details were typed or read off a row.
 *
 * The caller's permission is NOT checked here. `integration:manage` is enforced
 * by Tensor-Core against the bearer token, which is the only check that counts:
 * hiding a button is UX, and a server action is a public API that can be
 * replayed with any payload.
 */
export async function placeAgentCallAction(input: unknown): Promise<ActionResult<VoiceCallResult>> {
  const parsed = VoiceCallSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and retry.' }
  }

  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    const result = await placeVoiceCall(token, parsed.data)
    // The customer's number is deliberately absent from this line. It is
    // personal data, the attempt id is enough to find the call in Sarvam, and
    // a log is the easiest place for a phone number to end up somewhere nobody
    // meant it to.
    log.info({ attemptId: result.attempt_id }, 'Placed an agent call')
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
