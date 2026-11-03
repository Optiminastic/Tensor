import { z } from 'zod'

// A mapping Tensor proposes, so a product is configured by review rather than
// by authoring.
//
// Its own module because lib/validators/registry.ts is at its length limit,
// and these two belong together: every other schema there describes what IS
// configured, and these describe what COULD be.

/**
 * A mapping row Tensor proposes, for a person to review before saving.
 *
 * Shaped like a FieldMapWriteInput on purpose, so the editor fills its own
 * form from these and somebody edits what it filled — rather than reading a
 * recommendation on one screen and retyping it on another.
 *
 * NOTHING HERE IS APPLIED BY FETCHING IT. The registry row stays the source
 * of truth and the person still presses Save mapping. A proposal that wrote
 * itself would mean re-uploading a corrected drawing silently re-pointed a
 * live product's fields, and the first sign of it would be a batch of planks
 * with the names swapped.
 */
export const FieldSuggestionSchema = z.object({
  scad_variable: z.string(),
  property_key: z.string().optional().default(''),
  /** The storefront's own wording for that key — what a reviewer recognises.
   *  The key is what matches. */
  property_label: z.string().optional().default(''),
  value_type: z.enum(['string', 'number', 'count']),
  optional: z.boolean().optional().default(false),
  fixed_value: z.string().optional().default(''),
  default_value: z.string().optional().default(''),
  max_runes: z.number().nullish(),
  /** 'file' when the design said so in an `@from` comment, 'match' when
   *  Tensor paired the wording. The difference decides how hard to look. */
  source: z.enum(['file', 'match']),
  /** 'stated' | 'likely' | 'possible'. */
  strength: z.string(),
  /** The one sentence the reviewer needs: what matched, or what the file
   *  declared. Deliberately never a score — a number would read as precision
   *  this does not have. */
  why: z.string().optional().default(''),
  /** One real answer from a recent order, which settles "is this the name or
   *  the phone number?" faster than any explanation. */
  sample: z.string().optional().default(''),
  /** The author's own comment on the variable, verbatim. */
  note: z.string().optional().default(''),
})

export const FieldSuggestionsResponseSchema = z.object({
  template_key: z.string(),
  items: z.array(FieldSuggestionSchema),
})

export type FieldSuggestion = z.infer<typeof FieldSuggestionSchema>
export type FieldSuggestions = z.infer<typeof FieldSuggestionsResponseSchema>
