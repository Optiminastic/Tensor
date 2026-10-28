import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  indexIssues,
  type StationIssuesByJob,
  StationIssuesResponseSchema,
} from '@/lib/validators/station-issues'

const log = createLogger('StationIssuesService')
const TIMEOUT_MS = 10_000

export class StationIssuesServiceError extends Error {}

/**
 * What the floor has flagged on the jobs currently at a station.
 *
 * Scoped by the backend to what is on the board; every issue ever raised would
 * be a growing list nobody asked for.
 */
export async function listStationIssues(token: string, brand: string): Promise<StationIssuesByJob> {
  const path = `/brands/${encodeURIComponent(brand)}/production/station-issues`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new StationIssuesServiceError('Tensor-Core is unreachable.')
  }
  if (!response.ok) {
    throw new StationIssuesServiceError('Could not read the station issues.')
  }
  const parsed = StationIssuesResponseSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new StationIssuesServiceError('Tensor-Core returned something unexpected.')
  }
  return indexIssues(parsed.data.items)
}
