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

/**
 * The customer's live link, for the floor to hand back on the phone.
 *
 * An empty url is the ordinary answer, not an error: no link was issued, the
 * window has closed, or this deployment keeps no recoverable copy. The page
 * says the same thing for all three - there is nothing to copy.
 */
export const PersonalisationLinkSchema = z.object({
  url: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  expires_at: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
})

export type PersonalisationLinkCopy = z.infer<typeof PersonalisationLinkSchema>
