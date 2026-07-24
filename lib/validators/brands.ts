import { z } from 'zod'

/** Lowercase slug: alphanumerics joined by single hyphens. Mirrors the backend. */
export const BrandSlugSchema = z
  .string()
  .min(1, 'Give the brand a slug')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')

const AscendingLadder = z
  .array(z.number().int().positive())
  .min(1, 'The ladder needs at least one price')
  .refine(
    rungs => rungs.every((price, i) => i === 0 || price > rungs[i - 1]),
    'Prices must be strictly ascending',
  )

const greenAtOrBelowYellow = (
  data: { cp_green_max?: number; cp_yellow_max?: number },
  ctx: z.RefinementCtx,
): void => {
  if (
    data.cp_green_max !== undefined &&
    data.cp_yellow_max !== undefined &&
    data.cp_green_max > data.cp_yellow_max
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cp_green_max'],
      message: 'The green threshold must be at or below the yellow threshold',
    })
  }
}

/** A brand as returned by the backend. Snake_case to match the API. */
export const BrandProfileSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo_url: z.string().nullable(),
  starting_price: z.number(),
  shopify_url: z.string().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  ladder: z.array(z.number().int()),
  cp_green_max: z.number(),
  cp_yellow_max: z.number(),
  entry_machine_hours: z.number().nullable(),
  entry_rung: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

/** What an admin submits to create a brand. The slug may be derived from the name. */
export const BrandCreateSchema = z
  .object({
    name: z.string().min(1, 'Give the brand a name').max(120),
    slug: BrandSlugSchema.optional(),
    logo_url: z.string().max(500).nullable().optional(),
    starting_price: z.number().positive('Must be positive'),
    shopify_url: z.string().max(255).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    is_active: z.boolean().optional(),
    ladder: AscendingLadder,
    cp_green_max: z.number().gt(0).lte(1),
    cp_yellow_max: z.number().gt(0).lte(1),
    entry_machine_hours: z.number().positive().nullable().optional(),
    entry_rung: z.number().int().positive().nullable().optional(),
  })
  .superRefine(greenAtOrBelowYellow)

/** The partial edit sent to the backend. The slug is immutable. */
export const BrandUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    logo_url: z.string().max(500).nullable().optional(),
    starting_price: z.number().positive().optional(),
    shopify_url: z.string().max(255).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    is_active: z.boolean().optional(),
    ladder: AscendingLadder.optional(),
    cp_green_max: z.number().gt(0).lte(1).optional(),
    cp_yellow_max: z.number().gt(0).lte(1).optional(),
    entry_machine_hours: z.number().positive().nullable().optional(),
    entry_rung: z.number().int().positive().nullable().optional(),
  })
  .superRefine(greenAtOrBelowYellow)

export type BrandProfile = z.infer<typeof BrandProfileSchema>
export type BrandCreateInput = z.infer<typeof BrandCreateSchema>
export type BrandUpdateInput = z.infer<typeof BrandUpdateSchema>
