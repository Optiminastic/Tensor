import { z } from 'zod'

import { BrandSchema as BrandKeySchema } from '@/lib/validators/projects'

const AscendingLadder = z
  .array(z.number().int().positive())
  .min(1, 'The ladder needs at least one price')
  .refine(
    rungs => rungs.every((price, i) => i === 0 || price > rungs[i - 1]),
    'Prices must be strictly ascending',
  )

/** A brand as returned by the backend. Snake_case to match the API. */
export const BrandProfileSchema = z.object({
  id: z.string(),
  key: BrandKeySchema,
  name: z.string(),
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

/** The partial edit sent to the backend. `key` is immutable. */
export const BrandUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
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

export type BrandProfile = z.infer<typeof BrandProfileSchema>
export type BrandUpdateInput = z.infer<typeof BrandUpdateSchema>
