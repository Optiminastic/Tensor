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

/**
 * Live telemetry read straight from the printer via BambuBuddy
 * (GET /machine-fleet/:id/live).
 *
 * Deliberately not persisted anywhere: temperatures, fan speeds and drying
 * countdowns are true for a second. Storing them would mean a write per machine
 * per poll and a UI confidently showing a stale number.
 */
const LiveTemperatureSchema = z.object({
  current: z.number(),
  target: z.number(),
  heating: z.boolean(),
})

const LiveNozzleSchema = z.object({
  position: z.string(),
  diameter_mm: z.number(),
  type: z.string(),
  high_flow: z.boolean(),
  wear: z.number(),
  filament_colour: z.string(),
})

const LiveTraySchema = z.object({
  slot: z.number(),
  type: z.string(),
  colour: z.string(),
  remain_pct: z.number(),
  loaded: z.boolean(),
})

const LiveAmsSchema = z.object({
  id: z.number(),
  humidity_pct: z.number(),
  temperature_c: z.number(),
  drying: z.boolean(),
  dry_filament: z.string(),
  dry_minutes_left: z.number(),
  trays: z.array(LiveTraySchema),
})

export const FleetMachineLiveSchema = z.object({
  connected: z.boolean(),
  state: z.string(),
  state_label: z.string(),
  current_print: z.string(),
  progress_percent: z.number(),
  remaining_minutes: z.number(),
  layer_num: z.number(),
  total_layers: z.number(),
  wifi_dbm: z.number(),
  firmware_version: z.string(),
  door_open: z.boolean(),
  chamber_light: z.boolean(),
  sdcard: z.boolean(),
  nozzle_left: LiveTemperatureSchema.nullable(),
  nozzle_right: LiveTemperatureSchema.nullable(),
  bed: LiveTemperatureSchema,
  chamber: LiveTemperatureSchema,
  fan_cooling_pct: z.number(),
  fan_aux1_pct: z.number(),
  fan_aux2_pct: z.number(),
  fan_heatbreak_pct: z.number(),
  nozzles: z.array(LiveNozzleSchema),
  ams: z.array(LiveAmsSchema),
  health_messages: z.number(),
  worst_severity: z.number(),
})

export type FleetMachineLive = z.infer<typeof FleetMachineLiveSchema>
export type FleetMachineLiveAms = z.infer<typeof LiveAmsSchema>
export type FleetMachineLiveNozzle = z.infer<typeof LiveNozzleSchema>
export type FleetMachineLiveTemperature = z.infer<typeof LiveTemperatureSchema>
