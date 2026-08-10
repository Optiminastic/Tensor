// Server-only. The personalisation slice of the design API, split out of
// designs.service.ts to keep each file focused. It shares that module's low-level
// call/header helpers and DesignServiceError.
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import type { Design, DesignPersonalisationInput } from '@/lib/validators/designs'
import { DesignSchema } from '@/lib/validators/designs'
import {
  DesignServiceError,
  FILE_TIMEOUT_MS,
  authHeader,
  call,
  jsonHeaders,
} from '@/services/designs.service'

const log = createLogger('DesignPersonalisationService')

// Saves the applied personalisation (name + placement + colour) and triggers a
// re-slice from the baked model. An empty text clears it. Returns the design,
// which flips back to "queued" while the re-slice runs.
export async function saveDesignPersonalisation(
  token: string,
  id: string,
  input: DesignPersonalisationInput,
): Promise<Design> {
  return call(
    `/designs/${encodeURIComponent(id)}/personalisation`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => DesignSchema.parse(data),
  )
}

// Streams just the extruded name as its own STL, for the live editor to render as
// a separate, movable object. Returns the raw Response so the route handler pipes
// bytes straight through.
export async function fetchPersonaliseText(
  token: string,
  id: string,
  search: string,
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(
      `${env.TENSOR_CORE_URL}/designs/${encodeURIComponent(id)}/personalise-text${search}`,
      {
        headers: authHeader(token),
        cache: 'no-store',
        signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
      },
    )
  } catch (error) {
    log.error({ id, err: error }, 'Tensor-Core is unreachable')
    throw new DesignServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ id, status: response.status, detail }, 'Tensor-Core rejected the personalise text')
    throw new DesignServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}
