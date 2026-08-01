import { z } from 'zod'

// Machine slicing configuration, mirroring Tensor-Core's /machines DTO. Cost is
// deliberately absent - it lives on a separate, config:manage-gated surface.

export const NozzleSchema = z.union([
  z.literal(0.2),
  z.literal(0.4),
  z.literal(0.6),
  z.literal(0.8),
])
export const FlowSchema = z.enum(['standard', 'high_flow'])
export const MachineStatusSchema = z.enum(['online', 'busy', 'offline', 'maintenance'])

export const MachineFilamentSchema = z.object({
  material: z.string().min(1),
  filament_preset: z.string().min(1),
  density: z.number().positive(),
  is_default: z.boolean().optional().default(false),
})
export type MachineFilament = z.infer<typeof MachineFilamentSchema>

export const MachineSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string(),
  nozzle_mm: z.number(),
  flow: z.string(),
  default_colour: z.string().nullish(),
  layer_height_min_mm: z.number(),
  layer_height_max_mm: z.number(),
  supported_filaments: MachineFilamentSchema.array(),
  status: z.string(),
  is_active: z.boolean(),
  is_default: z.boolean(),
})
export type Machine = z.infer<typeof MachineSchema>

export const MachineInputSchema = z
  .object({
    name: z.string().min(1, 'Give the machine a name').max(120),
    family: z.string().min(1).max(16),
    nozzle_mm: NozzleSchema,
    flow: FlowSchema,
    default_colour: z.string().max(40).nullish(),
    layer_height_min_mm: z.number().min(0.02).max(0.6),
    layer_height_max_mm: z.number().min(0.02).max(0.6),
    supported_filaments: MachineFilamentSchema.array().min(1, 'Pick at least one filament'),
    status: MachineStatusSchema,
    is_active: z.boolean(),
    is_default: z.boolean(),
  })
  .refine(v => v.layer_height_min_mm <= v.layer_height_max_mm, {
    message: 'Minimum layer height must not exceed the maximum',
    path: ['layer_height_min_mm'],
  })
export type MachineInput = z.infer<typeof MachineInputSchema>

// The valid filament / layer-height options the bundled Bambu build offers for a
// (family, nozzle), used to populate the form so it can only be configured sane.
export const ProfileOptionsSchema = z.object({
  filaments: z
    .object({
      material: z.string(),
      filament_preset: z.string(),
      density: z.number(),
    })
    .array(),
  layer_heights: z.number().array(),
})
export type ProfileOptions = z.infer<typeof ProfileOptionsSchema>

// The machine cost view (config:manage), served by /config/machines. Kept apart
// from the slicing config so Operators never receive cost.
export const MachineCostSchema = z.object({
  id: z.string(),
  name: z.string(),
  machine_hour_cost: z.number(),
  is_active: z.boolean(),
})
export type MachineCost = z.infer<typeof MachineCostSchema>
