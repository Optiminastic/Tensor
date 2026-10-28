import { z } from 'zod'

/**
 * A problem somebody RAISED at a station.
 *
 * NOT `issue_reason` ON THE JOB. The two are different taxonomies and mixing
 * them up shows nothing at all for every issue the floor actually raised:
 *
 *  - `issue_reason` is pre-print validation (missing catalogue data), and
 *    setting it pulls a job out of batching.
 *  - A station issue is a physical defect found after printing, recorded as an
 *    event so the job stays in its queue where the next person will see it.
 */
export const StationIssueSchema = z.object({
  job_id: z.string(),
  /** Where it was raised - a defect found at QC still matters at packaging. */
  stage: z.string(),
  reason: z.string(),
  comment: z.string(),
  actor_id: z.string(),
  raised_at: z.string(),
})

export const StationIssuesResponseSchema = z.object({
  items: z.array(StationIssueSchema),
})

export type StationIssue = z.infer<typeof StationIssueSchema>

/** Keyed by job id, which is how every row looks one up. */
export type StationIssuesByJob = Record<string, StationIssue>

export function indexIssues(items: StationIssue[]): StationIssuesByJob {
  return items.reduce<StationIssuesByJob>((acc, issue) => {
    acc[issue.job_id] = issue
    return acc
  }, {})
}
