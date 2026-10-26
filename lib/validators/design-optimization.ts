import { z } from 'zod'

/**
 * The AI optimization advisor's report, returned by POST /designs/:id/optimize.
 *
 * ITS OWN FILE because designs.ts had grown past the 350-line limit the lint
 * rule enforces, and this is the part of it that answers a different question:
 * everything else there describes what a design IS, and this describes what
 * somebody thinks should change about it.
 *
 * Still re-exported from designs.ts, so nothing that imports it has to move.
 */
// The AI optimization advisor's report returned by POST /designs/:id/optimize:
// an overall verdict plus nozzle-aware filament, support, and ranked improvements.
export const OptimizationRecommendationSchema = z.object({
  title: z.string(),
  detail: z.string(),
  category: z.string(),
  impact: z.string(),
})
export const DesignOptimizationSchema = z.object({
  verdict: z.enum(['green', 'yellow', 'red']),
  summary: z.string(),
  filament: z.object({
    material: z.string(),
    recommended_preset: z.string(),
    rationale: z.string(),
  }),
  support: z.object({
    needed: z.boolean(),
    strategy: z.string(),
    material: z.string(),
    rationale: z.string(),
  }),
  recommendations: OptimizationRecommendationSchema.array(),
})
export type DesignOptimization = z.infer<typeof DesignOptimizationSchema>
