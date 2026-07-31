import type { OverviewStat } from '@/components/dashboard/overview-stats'
import type {
  ActivityPoint,
  FilamentRecord,
  MachineDetail,
  MachineRecord,
  MachineSummary,
  OrderRecord,
  ProductionJob,
  ProductionJobDetail,
  ProductionJobQueueItem,
} from '@/components/production/types'

// Illustrative content only: Tensor-Core has no production-jobs, batch, or
// filament-inventory backend yet (only a static /config/machines roster with
// no live status/telemetry). Replace with real service calls once those
// endpoints exist.

export const PRODUCTION_STATS: OverviewStat[] = [
  { label: 'Total Jobs', value: '250', hint: '+2.5% this month' },
  { label: 'Completed', value: '124', hint: '+2.5% this month' },
  { label: 'Failed', value: '14', hint: '-1.5% this month' },
  { label: 'Active Machines', value: '19', hint: '+2.5% this month' },
]

export const PRODUCTION_ACTIVITY: ActivityPoint[] = [
  { month: 'Jan', completed: 14, failed: 3 },
  { month: 'Feb', completed: 16, failed: 2 },
  { month: 'Mar', completed: 15, failed: 3 },
  { month: 'Apr', completed: 19, failed: 4 },
  { month: 'May', completed: 24, failed: 3 },
  { month: 'Jun', completed: 23, failed: 5 },
  { month: 'Jul', completed: 22, failed: 4 },
  { month: 'Aug', completed: 26, failed: 3 },
  { month: 'Sep', completed: 21, failed: 4 },
  { month: 'Oct', completed: 25, failed: 3 },
  { month: 'Nov', completed: 27, failed: 4 },
  { month: 'Dec', completed: 29, failed: 3 },
]

export const RECENT_JOBS: ProductionJob[] = [
  {
    id: '#2041',
    designName: 'Wall Planter — Ribbed',
    machine: 'Machine A',
    startedAt: 'Jul 30, 2026',
    durationHours: 3.5,
    status: 'printing',
  },
  {
    id: '#2040',
    designName: 'Desk Organizer — Modular',
    machine: 'Machine C',
    startedAt: 'Jul 30, 2026',
    durationHours: 2.1,
    status: 'queued',
  },
  {
    id: '#2039',
    designName: 'Pendant Light Shade',
    machine: 'Machine B',
    startedAt: 'Jul 29, 2026',
    durationHours: 5.25,
    status: 'completed',
  },
  {
    id: '#2038',
    designName: 'Cable Clip — 6mm',
    machine: 'Machine D',
    startedAt: 'Jul 29, 2026',
    durationHours: 0.75,
    status: 'completed',
  },
  {
    id: '#2037',
    designName: 'Vase — Twist 220mm',
    machine: 'Machine A',
    startedAt: 'Jul 28, 2026',
    durationHours: 6.4,
    status: 'failed',
  },
]

export const MACHINES: MachineSummary[] = [
  { id: 'machine-a', name: 'Machine A', status: 'printing', jobsToday: 12 },
  { id: 'machine-b', name: 'Machine B', status: 'idle', jobsToday: 8 },
  { id: 'machine-c', name: 'Machine C', status: 'printing', jobsToday: 15 },
  { id: 'machine-d', name: 'Machine D', status: 'offline', jobsToday: 0 },
]

// The three printers registered so far, matching the machine profiles jobs are
// assigned to (H2C-01/02/03) - live status, not a jobs-done tally.
export const MACHINE_RECORDS: MachineRecord[] = [
  { id: 'h2c-03', name: 'H2C-03', status: 'offline', addedAt: 'Jul 30, 2026' },
  { id: 'h2c-02', name: 'H2C-02', status: 'offline', addedAt: 'Jul 30, 2026' },
  { id: 'h2c-01', name: 'H2C-01', status: 'online', addedAt: 'Jul 25, 2026' },
]

// All three H2C units are the same model, so they share one product photo and
// nozzle/filament spec - only the id, IP and live status differ per unit.
export const MACHINE_IMAGE_SRC = '/production/h2c-printer.png'
const MACHINE_FILAMENTS = ['White', 'Blue', 'Green', 'Red']

export const MACHINE_DETAILS: MachineDetail[] = MACHINE_RECORDS.map((machine, index) => ({
  ...machine,
  machineNumber: machine.name,
  ipAddress: `192.168.1.${101 + index}`,
  leftNozzleMm: 0.4,
  rightNozzleMm: 0.4,
  availableFilaments: MACHINE_FILAMENTS,
  imageSrc: MACHINE_IMAGE_SRC,
}))

export function getMachineDetail(id: string): MachineDetail | undefined {
  return MACHINE_DETAILS.find(machine => machine.id === id)
}

// [job id, description, qty] — every job lands in the queue the same way: not
// yet personalised, QC pending, unpacked, no priority set.
const QUEUED_JOBS: Array<[string, string, number]> = [
  ['JOB-0C26B4', 'Ziptie 3mm All', 6],
  ['JOB-DAFF7B', 'Stl', 1],
  ['JOB-5D3770', 'Pot Dune', 1],
  ['JOB-433791', 'Pot Dune Buse 06 Mm', 1],
  ['JOB-2B489B', 'Cable Holder Vcd', 4],
  ['JOB-AAE8F1', 'Boxopener', 3],
  ['JOB-194A4C', 'Boomerang V2', 1],
  ['JOB-57A06D', 'Audi Body', 1],
  ['JOB-5EFF35', 'Assembled Funnel Holder', 1],
  ['JOB-23A105', 'Modern Chair Of Mine1', 1],
  ['JOB-54FBEF', 'Dragon 2.5', 1],
  ['JOB-7E58A9', '20X20S', 1],
  ['JOB-6D9975', '2 Color Bottom', 1],
  ['JOB-41B608', '1M Cable Organizer', 1],
]

export const PRODUCTION_JOB_QUEUE: ProductionJobQueueItem[] = QUEUED_JOBS.map(
  ([id, description, qty]) => ({
    id,
    description,
    qty,
    status: 'queued',
    personalisation: 'not_required',
    qc: 'pending',
    packaging: 'pending',
    priority: 0,
    createdAt: 'Jul 27, 2026',
  }),
)

// Fabrication specifics per job, keyed to QUEUED_JOBS by array position:
// [shopifyOrderId, sku, material, colourProfile, machineProfile, filamentRequirementG, estimatedPrintTimeMin, dueDate]
const JOB_FABRICATION_DETAILS: Array<
  [string, string, string, string, string, number, number, string]
> = [
  ['7014', 'STL-014', 'ABS - Black', 'Black', 'H2C-01', 24, 15, 'Aug 02, 2026'],
  ['7015', 'STL-015', 'PLA - White', 'White', 'H2C-02', 8.5, 10, 'Aug 02, 2026'],
  ['7016', 'STL-016', 'PETG - Clear', 'Clear', 'H2C-01', 42, 55, 'Aug 03, 2026'],
  ['7017', 'STL-017', 'PETG - Clear', 'Clear', 'H2C-01', 18, 25, 'Aug 03, 2026'],
  ['7018', 'STL-018', 'ABS - Black', 'Black', 'H2C-03', 36, 40, 'Aug 03, 2026'],
  ['7019', 'STL-019', 'PLA - Orange', 'Orange', 'H2C-02', 27, 30, 'Aug 03, 2026'],
  ['7020', 'STL-020', 'PLA - Grey', 'Grey', 'H2C-01', 15, 20, 'Aug 04, 2026'],
  ['7021', 'STL-021', 'ABS - Red', 'Red', 'H2C-03', 64, 90, 'Aug 04, 2026'],
  ['7022', 'STL-022', 'PETG - Black', 'Black', 'H2C-02', 48, 65, 'Aug 04, 2026'],
  ['7023', 'STL-023', 'PLA - White', 'White', 'H2C-01', 96, 140, 'Aug 05, 2026'],
  ['7024', 'STL-024', 'ABS - Green', 'Green', 'H2C-03', 52, 75, 'Aug 05, 2026'],
  ['7025', 'STL-025', 'PLA - Black', 'Black', 'H2C-02', 6, 8, 'Aug 05, 2026'],
  ['7026', 'STL-026', 'PETG - White/Black', 'Mixed', 'H2C-01', 22, 35, 'Aug 06, 2026'],
  ['7027', 'STL-027', 'PLA - Blue', 'Blue', 'H2C-02', 12, 18, 'Aug 06, 2026'],
]

export const PRODUCTION_JOB_DETAILS: ProductionJobDetail[] = PRODUCTION_JOB_QUEUE.map(
  (job, index) => {
    const [
      shopifyOrderId,
      sku,
      material,
      colourProfile,
      machineProfile,
      filamentG,
      printMin,
      dueDate,
    ] = JOB_FABRICATION_DETAILS[index]
    return {
      ...job,
      shopifyOrderId,
      sku,
      material,
      colourProfile,
      machineProfile,
      filamentRequirementG: filamentG,
      estimatedPrintTimeMin: printMin,
      dueDate,
      printFileAvailable: true,
      personalisationNote: `This job has no personalisation data — ${job.personalisation}.`,
    }
  },
)

export function getProductionJobDetail(id: string): ProductionJobDetail | undefined {
  return PRODUCTION_JOB_DETAILS.find(job => job.id === id)
}

export const FILAMENT_MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'ASA'] as const

export const INITIAL_FILAMENTS: FilamentRecord[] = [
  {
    id: 'fil-001',
    material: 'PLA',
    brand: 'eSun',
    color: 'White',
    quantity: 12,
    quantityUnit: 'kg',
    diameterMm: 1.75,
    densityGCm3: 1.24,
    price: 1450,
  },
  {
    id: 'fil-002',
    material: 'PLA',
    brand: 'Bambu Lab',
    color: 'Black',
    quantity: 8,
    quantityUnit: 'kg',
    diameterMm: 1.75,
    densityGCm3: 1.24,
    price: 1650,
  },
  {
    id: 'fil-003',
    material: 'PETG',
    brand: 'Polymaker',
    color: 'Clear',
    quantity: 6,
    quantityUnit: 'kg',
    diameterMm: 1.75,
    densityGCm3: 1.27,
    price: 1800,
  },
  {
    id: 'fil-004',
    material: 'ABS',
    brand: 'eSun',
    color: 'Black',
    quantity: 5,
    quantityUnit: 'kg',
    diameterMm: 1.75,
    densityGCm3: 1.04,
    price: 1550,
  },
  {
    id: 'fil-005',
    material: 'PLA',
    brand: 'Bambu Lab',
    color: 'Red',
    quantity: 20,
    quantityUnit: 'count',
    diameterMm: 1.75,
    densityGCm3: 1.24,
    price: 1650,
  },
  {
    id: 'fil-006',
    material: 'TPU',
    brand: 'Polymaker',
    color: 'Grey',
    quantity: 4,
    quantityUnit: 'kg',
    diameterMm: 2.85,
    densityGCm3: 1.21,
    price: 2400,
  },
  {
    id: 'fil-007',
    material: 'ASA',
    brand: 'eSun',
    color: 'Grey',
    quantity: 3,
    quantityUnit: 'kg',
    diameterMm: 1.75,
    densityGCm3: 1.07,
    price: 2100,
  },
  {
    id: 'fil-008',
    material: 'Nylon',
    brand: 'Polymaker',
    color: 'Black',
    quantity: 10,
    quantityUnit: 'count',
    diameterMm: 2.85,
    densityGCm3: 1.14,
    price: 3200,
  },
]

export const ORDERS: OrderRecord[] = [
  {
    id: 'order-1042',
    orderNumber: '#1042',
    store: 'tensor-decor.myshopify.com',
    customer: 'Ravi Shah',
    submittedAt: 'Jul 31, 2026',
    total: 720,
    status: 'pending',
    lineItems: [{ name: 'Cable Clip — 6mm', quantity: 4 }],
  },
  {
    id: 'order-1041',
    orderNumber: '#1041',
    store: 'tensor-decor.myshopify.com',
    customer: 'Ravi Shah',
    submittedAt: 'Jul 30, 2026',
    total: 1840,
    status: 'pending',
    lineItems: [
      { name: 'Wall Planter — Ribbed', quantity: 2 },
      { name: 'Desk Organizer — Modular', quantity: 1 },
    ],
  },
  {
    id: 'order-1040',
    orderNumber: '#1040',
    store: 'tensor-decor.myshopify.com',
    customer: 'Meera Nair',
    submittedAt: 'Jul 30, 2026',
    total: 640,
    status: 'paid',
    lineItems: [{ name: 'Desk Organizer — Modular', quantity: 1 }],
  },
  {
    id: 'order-1039',
    orderNumber: '#1039',
    store: 'tensor-gifting.myshopify.com',
    customer: 'Arjun Kapoor',
    submittedAt: 'Jul 29, 2026',
    total: 3120,
    status: 'paid',
    lineItems: [
      { name: 'Pendant Light Shade', quantity: 2 },
      { name: 'Cable Clip — 6mm', quantity: 2 },
    ],
  },
  {
    id: 'order-1038',
    orderNumber: '#1038',
    store: 'tensor-decor.myshopify.com',
    customer: 'Priya Menon',
    submittedAt: 'Jul 29, 2026',
    total: 260,
    status: 'paid',
    lineItems: [{ name: 'Vase — Twist 220mm', quantity: 1 }],
  },
  {
    id: 'order-1037',
    orderNumber: '#1037',
    store: 'tensor-gifting.myshopify.com',
    customer: 'Karan Malhotra',
    submittedAt: 'Jul 28, 2026',
    total: 2150,
    status: 'cancelled',
    lineItems: [
      { name: 'Boomerang V2', quantity: 1 },
      { name: 'Audi Body', quantity: 2 },
    ],
  },
  {
    id: 'order-1036',
    orderNumber: '#1036',
    store: 'tensor-decor.myshopify.com',
    customer: null,
    submittedAt: 'Jul 28, 2026',
    total: 480,
    status: 'refunded',
    lineItems: [{ name: 'Modern Chair Of Mine1', quantity: 1 }],
  },
]

export function getOrderDetail(id: string): OrderRecord | undefined {
  return ORDERS.find(order => order.id === id)
}
