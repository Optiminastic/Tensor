import { z } from 'zod'

// The physical printer fleet, mirroring Tensor-Core's /machine-fleet DTO.
// Distinct from lib/validators/machines.ts, which is the machine_profiles
// slicing-config/cost view - this is live per-unit print-state.

export const FleetMachineStatusSchema = z.enum(['idle', 'running', 'off'])
export type FleetMachineStatus = z.infer<typeof FleetMachineStatusSchema>

export const FleetFilamentSchema = z.object({
  colour: z.string(),
  type: z.string(),
  remaining_grams: z.number(),
})
export type FleetFilament = z.infer<typeof FleetFilamentSchema>

export const FleetMachineSchema = z.object({
  id: z.string(),
  machine_id: z.string(),
  name: z.string(),
  image_url: z.string().nullable(),
  status: FleetMachineStatusSchema,
  filaments: FleetFilamentSchema.array(),
  current_batch_id: z.string().nullable(),
  current_layer: z.number().nullable(),
  total_layers: z.number().nullable(),
  batch_total_time_minutes: z.number().nullable(),
  print_started_at: z.string().nullable(),
  remaining_seconds: z.number().nullable(),
  total_waste_grams: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type FleetMachine = z.infer<typeof FleetMachineSchema>
