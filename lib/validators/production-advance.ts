import { z } from 'zod'

/** The four stations the arrow can complete. Dispatch is a shipment, not a station. */
export const AdvanceStationSchema = z.enum(['assembly', 'finishing', 'qc', 'packaging'])

export const AdvanceResultSchema = z.object({
  moved: z.number(),
  /**
   * Jobs that were no longer waiting at this station - somebody else moved
   * them while the selection was open. Not a failure: what the presser wanted
   * is already true.
   */
  skipped: z.number(),
  failed: z.number(),
  detail: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
})

export type AdvanceStation = z.infer<typeof AdvanceStationSchema>
export type AdvanceResult = z.infer<typeof AdvanceResultSchema>
