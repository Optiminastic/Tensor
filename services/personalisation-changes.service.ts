import {
  type PersonalisationChange,
  PersonalisationChangesResponseSchema,
  type PersonalisationLinkCopy,
  PersonalisationLinkSchema,
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

/** The customer's live link for one job's order, or an empty url. */
export async function fetchPersonalisationLink(jobId: string): Promise<PersonalisationLinkCopy> {
  const response = await fetch(
    `/api/production-jobs/${encodeURIComponent(jobId)}/personalisation-link`,
    { cache: 'no-store' },
  )
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return PersonalisationLinkSchema.parse(await response.json())
}
