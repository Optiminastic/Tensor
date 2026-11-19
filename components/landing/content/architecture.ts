import { LOGOS } from '@/components/landing/content/logos'
import type { CardLogo } from '@/components/landing/info-card'

/** One step of an order's journey through Tensor. */
export interface FlowStep {
  title: string
  detail: string
  /** The part of the system that does it. */
  by: string
}

/** The order-to-doorstep pipeline, in the order work moves through it. */
export const ORDER_FLOW: readonly FlowStep[] = [
  {
    title: 'Order arrives',
    detail:
      'The production worker pulls Shopify every minute for orders updated since its last pull, and in full every 10 minutes. Imports are idempotent upserts on the Shopify id.',
    by: 'Production worker · Shopify',
  },
  {
    title: 'Jobs are created',
    detail:
      'Each line becomes one job per printed part, matched to its registry product by SKU. Bundle items become their own jobs, named for what they print.',
    by: 'Job-creation queue',
  },
  {
    title: 'The customer confirms',
    detail:
      'Products that need it send a WhatsApp link with a preview; the customer checks their name before anything prints.',
    by: 'Personalisation-link worker · WhatsApp',
  },
  {
    title: 'The model is rendered',
    detail:
      'OpenSCAD renders the part’s design file with the customer’s fields as variables, producing a coloured 3MF that is measured and stored in S3.',
    by: 'Model-generation queue · OpenSCAD',
  },
  {
    title: 'Beds are planned',
    detail:
      'Waiting jobs are grouped by material, colour and nozzle, oldest order first, and packed onto the smallest machine class whose bed fits them.',
    by: 'Batch worker',
  },
  {
    title: 'The plate goes to a printer',
    detail:
      'The merged plate is laid out for the chosen machine, sliced in Bambu Studio and queued on the printer through BambuBuddy.',
    by: 'Batch worker · Slice worker · BambuBuddy',
  },
  {
    title: 'Printed, checked, packed',
    detail:
      'BambuBuddy’s print history marks the bed printed; each job then passes assembly, QC and packaging stations.',
    by: 'Batch worker · Stations',
  },
  {
    title: 'Shipped and followed',
    detail:
      'The parcel ships through Delhivery with tracking; failed deliveries surface as NDR actions and returns as reverse pickups.',
    by: 'API · Delhivery',
  },
]

/** One running part of the system. */
export interface SystemPart {
  name: string
  role: string
  details: readonly string[]
}

/** The processes Tensor runs, and what each owns. */
export const SYSTEM_PARTS: readonly SystemPart[] = [
  {
    name: 'Web app',
    role: 'Next.js on Vercel, beside the backend’s region',
    details: [
      'Server components render each page; server actions write',
      'Sign-in and sessions; mints the short-lived token the backend trusts',
      'Owns no domain data - everything goes through the API',
    ],
  },
  {
    name: 'Tensor-Core API',
    role: 'Go service: the source of truth',
    details: [
      'Every route guarded by a permission, checked against a verified JWT',
      'Costing engine, registry, orders, batches, fulfilment, integrations',
      'Enqueues work for the workers inside the same database transaction',
    ],
  },
  {
    name: 'Production worker',
    role: 'Orders in, jobs and models out',
    details: [
      'Shopify order sync (quick and full)',
      'Job creation and OpenSCAD model generation',
      'Customer-facing personalisation links',
    ],
  },
  {
    name: 'Batch worker',
    role: 'The print bed’s whole lifecycle',
    details: [
      'Plans beds, locks them, dispatches to printers',
      'Fleet sync and print completion from BambuBuddy',
    ],
  },
  {
    name: 'Slice worker',
    role: 'Bambu Studio, headless',
    details: ['Costs every uploaded design', 'Slices merged plates for the printer'],
  },
  {
    name: 'Agent & report workers',
    role: 'Scheduled jobs that talk to people',
    details: [
      'Abandoned-checkout calls and WhatsApp follow-ups',
      'Accounts report by email',
      'Retention: removes data past 30 days, keeping a daily summary',
    ],
  },
]

/** One algorithm Tensor uses, and where. */
export interface Algorithm {
  name: string
  where: string
  how: string
}

export const ALGORITHMS: readonly Algorithm[] = [
  {
    name: 'Guillotine bin packing (Best-Area-Fit)',
    where: 'Print beds',
    how: 'Places each part in the free rectangle that leaves the least area, splitting the remainder guillotine-style. Parts go largest first, and the planner tries several orderings and keeps the best, because the packer is order-sensitive.',
  },
  {
    name: 'Colour-first FCFS batching',
    where: 'Batch planner',
    how: 'Jobs are grouped by material, colour and nozzle, oldest order first. A bed locks once it holds 3+ units and a printer is free, up to 5 units, with one bed per machine; priority flags do not jump the queue.',
  },
  {
    name: 'Bed-class escalation',
    where: 'Batch planner',
    how: 'A bed starts on the class its unit count asks for and is promoted P2S → H2C → A2L until every part physically fits, so a large part never empties a bed.',
  },
  {
    name: 'Overhang-area orientation scoring',
    where: 'Design advice',
    how: 'Scores each candidate resting face by the mesh area that would overhang downward (Tweaker-style) and recommends the least-support orientation.',
  },
  {
    name: 'Slicer-based costing with price ladders',
    where: 'Costing engine',
    how: 'Design CP is computed from the slicer’s grams and minutes; the selling price snaps up to the brand’s ladder, and money rounds half-to-even, matching the original spreadsheet to the paisa.',
  },
  {
    name: 'Parametric rendering',
    where: 'Model generation',
    how: 'Each order field is mapped to a declared OpenSCAD variable and passed with -D; a file that does not declare a mapped variable is refused, because OpenSCAD would otherwise ignore it silently.',
  },
  {
    name: 'Incremental sync with overlap',
    where: 'Shopify order sync',
    how: 'Each quick pull asks only for orders updated since the previous pull began, less a two-minute overlap; a failed pull falls back to the two-day window so nothing is missed.',
  },
  {
    name: 'Summarise-then-delete retention',
    where: 'Retention worker',
    how: 'Each expired trading day (noon to noon IST) is rolled up into a summary before its rows are deleted, jobs before orders, so a crash leaves a summarised day rather than a lost one.',
  },
]

/** One engineering practice Tensor follows. */
export interface Practice {
  title: string
  detail: string
}

export const PRACTICES: readonly Practice[] = [
  {
    title: 'Authorization lives in the backend',
    detail:
      'Every route is guarded by a named permission against a verified EdDSA JWT. No roles means no access - it fails closed - and a role change is enforced through a permissions version checked on each request.',
  },
  {
    title: 'The slicer is the source of truth',
    detail:
      'Time, filament and cost come from the slicer, never from an estimate; the costing engine is pure code with no database or I/O, tested against the spec’s own numbers.',
  },
  {
    title: 'Typed data end to end',
    detail:
      'SQL is written by hand and compiled to typed Go with sqlc - no ORM. Every API response the web app reads is validated with Zod, and every form and server action re-validates its input.',
  },
  {
    title: 'Work happens on queues',
    detail:
      'Background work runs on River, a Postgres-backed job queue: enqueued in the same transaction as the data it belongs to, retried with bounded attempts, deduplicated by key.',
  },
  {
    title: 'Idempotent by design',
    detail:
      'Order imports upsert on the Shopify id, job creation locks the order, and every sweep is safe to re-run - a retry costs time, never duplicates.',
  },
  {
    title: 'Secrets encrypted at rest',
    detail:
      'Store and integration credentials are sealed with AES-256-GCM in the database; service-to-service calls use a shared secret compared in constant time.',
  },
  {
    title: 'Migrations and real-database tests',
    detail:
      'The schema is versioned with goose migrations, and the integration suite runs against a real PostgreSQL before every release.',
  },
  {
    title: 'Fast by default',
    detail:
      'Pages stream a skeleton at once; the open product loads alone; sessions reuse a short-lived token; design files are cached in memory by version; the web app runs next to the backend.',
  },
]

/** One technology in the stack. */
export interface Tech {
  name: string
  use: string
  logo?: CardLogo
}

export interface TechGroup {
  label: string
  items: readonly Tech[]
}

export const TECH_STACK: readonly TechGroup[] = [
  {
    label: 'Frontend',
    items: [
      { name: 'Next.js 16', use: 'App Router, server components and actions', logo: LOGOS.nextjs },
      { name: 'React 19', use: 'The interface', logo: LOGOS.react },
      { name: 'TypeScript 5', use: 'Strict typing across the app', logo: LOGOS.typescript },
      { name: 'Tailwind CSS 4', use: 'Styling on design tokens', logo: LOGOS.tailwind },
      { name: 'Zod', use: 'Validates every response and form', logo: LOGOS.zod },
      {
        name: 'TanStack Query · Recharts · three.js',
        use: 'Data fetching, charts and 3D previews',
      },
      { name: 'Better Auth', use: 'Sessions, and the JWT + JWKS the backend verifies' },
      { name: 'pnpm', use: 'Package manager', logo: LOGOS.pnpm },
    ],
  },
  {
    label: 'Backend',
    items: [
      { name: 'Go 1.25', use: 'The API and every worker', logo: LOGOS.go },
      { name: 'Gin', use: 'HTTP routing and validation', logo: LOGOS.gin },
      { name: 'pgx · sqlc · goose', use: 'PostgreSQL driver, typed queries, migrations' },
      { name: 'River', use: 'Postgres-backed job queue for the workers' },
      { name: 'OpenSCAD', use: 'Parametric model rendering', logo: LOGOS.openscad },
      { name: 'Bambu Studio', use: 'Headless slicing', logo: LOGOS.bambulab },
    ],
  },
  {
    label: 'Data & infrastructure',
    items: [
      { name: 'PostgreSQL', use: 'The one database for data and queues', logo: LOGOS.postgresql },
      { name: 'Amazon S3', use: 'Design files, models and plates', logo: LOGOS.s3 },
      { name: 'Docker', use: 'Every service as a container', logo: LOGOS.docker },
      { name: 'Vercel', use: 'Hosts the web app', logo: LOGOS.vercel },
      { name: 'Caddy', use: 'TLS and routing in front of the API', logo: LOGOS.caddy },
    ],
  },
]

/** Each Architecture section's heading and intro, in page order. */
export const ARCH_SECTIONS = {
  flow: {
    id: 'flow',
    eyebrow: 'The pipeline',
    title: 'An order’s journey, step by step',
    intro:
      'Every order follows the same path, and every step is done by a named part of the system - nothing waits on someone remembering to press a button.',
  },
  system: {
    id: 'system',
    eyebrow: 'The system',
    title: 'The services and what each one owns',
    intro:
      'One backend is the source of truth. The web app renders it; the workers consume its queues, each owning one part of the work so a slow render never holds up an order.',
  },
  algorithms: {
    id: 'algorithms',
    eyebrow: 'Algorithms',
    title: 'The decisions Tensor makes, and how',
    intro:
      'Packing a bed, choosing a printer, pricing a design and keeping the store in sync are all rules in code - deterministic, tested and explainable.',
  },
  practices: {
    id: 'practices',
    eyebrow: 'Engineering',
    title: 'The practices it is built on',
    intro:
      'The rules the codebase holds itself to, so the numbers stay right and the floor keeps moving.',
  },
  stack: {
    id: 'stack',
    eyebrow: 'Tech stack',
    title: 'What it is made of',
    intro:
      'Mainstream, well-supported tools at every layer - and one database for both the data and the work queues.',
  },
} as const
