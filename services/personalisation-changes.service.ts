import {
  type PersonalisationChange,
  PersonalisationChangesResponseSchema,
} from '@/lib/validators/personalisation-changes'

/**
 * What the customer changed on one job.
 *
 * Fetched through the app's own proxy rather than straight from Tensor-Core,
 * because this runs in the browser and the backend token belongs to the
 * server.
 */
export async function fetchPersonalisationChanges(jobId: string): Promise<PersonalisationChange[]> {
  const response = await fetch(
    `/api/production-jobs/${encodeURIComponent(jobId)}/personalisation-changes`,
    { cache: 'no-store' },
  )
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return PersonalisationChangesResponseSchema.parse(await response.json()).changes
}
