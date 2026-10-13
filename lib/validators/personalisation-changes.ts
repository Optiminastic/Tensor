import { z } from 'zod'

/**
 * One value the customer moved on their own personalisation link.
 *
 * Keyed on the LABEL they saw rather than on a normalised key: this is read
 * beside the order by somebody about to make the thing, and "STEP 4 - First
 * Name" is what both of them are looking at.
 */
export const PersonalisationChangeSchema = z.object({
  label: z.string(),
  from: z.string(),
  to: z.string(),
})

export const PersonalisationChangesResponseSchema = z.object({
  changed: z.boolean(),
  changes: z
    .array(PersonalisationChangeSchema)
    .nullish()
    .transform(v => v ?? []),
})

export type PersonalisationChange = z.infer<typeof PersonalisationChangeSchema>
