// Server-only. Per-product analytics for a design, split out to keep
// designs.service.ts focused. Shares that module's low-level call/header helpers.
import type { DesignPerformance } from '@/lib/validators/designs'
import { DesignPerformanceSchema } from '@/lib/validators/designs'
import { call, jsonHeaders } from '@/services/designs.service'

/** Unit economics + real sales/production counts for a design's catalog SKU. */
export async function getDesignPerformance(token: string, id: string): Promise<DesignPerformance> {
  return call(
    `/designs/${encodeURIComponent(id)}/performance`,
    { headers: jsonHeaders(token) },
    data => DesignPerformanceSchema.parse(data),
  )
}
