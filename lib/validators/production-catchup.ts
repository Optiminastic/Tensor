import { z } from 'zod'

/**
 * The bulk catch-up: marking station queues done for goods already shipped.
 *
 * THE ONE ACTION THAT DECLARES WORK FINISHED NOBODY DID. Everything else on
 * the packaging page records something a person performed and saw. This
 * records that the board was out of date, which is a different claim, and the
 * screen is written so nobody can press it thinking otherwise.
 */
export const CatchUpJobSchema = z.object({
  job_number: z.string(),
  /** The station it is currently stuck at, named as the tabs name it. */
  waiting: z.string(),
})

export const CatchUpPreviewSchema = z.object({
  total: z.number(),
  jobs: z.array(CatchUpJobSchema),
})

export const CatchUpResultSchema = z.object({
  advanced: z.number(),
  failed: z.number(),
  /**
   * Orders recorded as shipped. Lower than `advanced`, because an order
   * usually carries several jobs and went out in one parcel.
   */
  dispatched: z.number(),
  jobs: z.array(z.string()),
})

export type CatchUpJob = z.infer<typeof CatchUpJobSchema>
export type CatchUpPreview = z.infer<typeof CatchUpPreviewSchema>
export type CatchUpResult = z.infer<typeof CatchUpResultSchema>
