import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type PartFile, PartFileSchema } from '@/lib/validators/part-files'

const log = createLogger('PartFilesService')
const TIMEOUT_MS = 15_000

export class PartFilesServiceError extends Error {}

/**
 * Every stored part file in the registry.
 *
 * READ-ONLY, and deliberately so: a part file is uploaded, replaced and
 * deleted through the component it belongs to, where the machine class and the
 * SKU it is addressed by are both on screen. This is the library view the
 * Designs tab lists as its third section.
 *
 * Its own module rather than another function on the registry service, which
 * is already at the line limit — and these are not registry products, they are
 * files hanging off components.
 */
export async function listPartFiles(token: string): Promise<PartFile[]> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}/registry/part-files`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.warn({ error }, 'Tensor-Core is unreachable')
    throw new PartFilesServiceError('Could not reach Tensor-Core.')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new PartFilesServiceError(detail ?? 'Could not load the part files.')
  }

  const body: unknown = await response.json()
  try {
    return PartFileSchema.array().parse((body as { items?: unknown }).items ?? [])
  } catch (error) {
    // A schema mismatch is otherwise invisible: the page catches it and
    // renders an empty section, which looks exactly like a shop that has
    // uploaded no part files.
    log.warn({ error }, 'Tensor-Core sent a shape the part files do not expect')
    throw new PartFilesServiceError('Could not read the part files response.')
  }
}
