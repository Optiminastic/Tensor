import { z } from 'zod'

/**
 * Which assembled file one colourway's personalisation preview is drawn from.
 *
 * The preview is a PICTURE, never a print: it shows the whole product the
 * customer receives - a lotus with its diya cup standing on it - while the
 * model that reaches a bed is the personalised plate alone.
 */
export const PreviewDesignSchema = z.object({
  variant_sku: z.string(),
  /** Empty when this colourway has none, and its picture is of what prints. */
  template_key: z.string(),
})

export const PreviewDesignsResponseSchema = z.object({
  items: z.array(PreviewDesignSchema),
})

export type PreviewDesign = z.infer<typeof PreviewDesignSchema>

/**
 * What one child SKU still needs before an order can be made from it.
 *
 * Problems stop an order; notes are worth knowing and do not. They are
 * separate because a screen that shows both as failures teaches people to
 * ignore it.
 */
export const SKUReadinessSchema = z.object({
  variant_id: z.string(),
  sku: z.string(),
  name: z.string(),
  status: z.string(),
  ready: z.boolean(),
  problems: z
    .array(z.string())
    .nullish()
    .transform(v => v ?? []),
  notes: z
    .array(z.string())
    .nullish()
    .transform(v => v ?? []),
})

export const SKUReadinessResponseSchema = z.object({
  items: z.array(SKUReadinessSchema),
})

export type SKUReadiness = z.infer<typeof SKUReadinessSchema>
