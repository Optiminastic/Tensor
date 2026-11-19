import {
  Boxes,
  Calculator,
  ClipboardCheck,
  Compass,
  Cpu,
  FileCode2,
  Layers,
  LayoutGrid,
  MessageCircle,
  Mic,
  Package,
  PackageCheck,
  Phone,
  Printer,
  Receipt,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Timer,
  Truck,
  Users,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

export interface Feature {
  title: string
  description: string
  points: readonly string[]
  icon: LucideIcon
  tag: string
}

export interface FeatureGroup {
  id: string
  eyebrow: string
  title: string
  intro: string
  items: readonly Feature[]
}

/**
 * Everything Tensor does, grouped the way the dashboard is: designs and their
 * cost, the product registry, orders into jobs, beds onto printers, the parcel
 * out of the door, and the agent that brings customers back.
 */
export const FEATURE_GROUPS: readonly FeatureGroup[] = [
  {
    id: 'designs',
    eyebrow: 'Designs & costing',
    title: 'Every design costed from the slicer, never estimated',
    intro:
      'A design is uploaded, sliced headless in Bambu Studio and priced from what the slicer measured - filament grams and print time - before anyone decides to sell it.',
    items: [
      {
        title: 'Design workflow',
        description: 'Upload, review and approve every model before it reaches the store.',
        points: [
          'STL, 3MF and STEP uploads with a preview image',
          'Drafts → Submitted → Approved → Archived, with review notes',
          'Approved designs publish to Shopify as products',
        ],
        icon: LayoutGrid,
        tag: 'Designs',
      },
      {
        title: 'Slicer-based costing',
        description: 'The slicer is the source of truth for time, filament and cost.',
        points: [
          'Headless Bambu Studio slice per design and material',
          'Design CP from grams, minutes and the brand’s cost assumptions',
          'Selling price snapped to the brand’s price ladder',
          'Green / Yellow / Red against the CP-as-%-of-SP thresholds',
        ],
        icon: Calculator,
        tag: 'Costing',
      },
      {
        title: 'Orientation advice',
        description: 'Suggests the resting face that needs the least support.',
        points: [
          'Scores candidate “down” faces by downward-overhang area',
          'Advisory only - it never changes the costed slice',
        ],
        icon: Compass,
        tag: 'Designs',
      },
      {
        title: 'Pricing rules & cost reports',
        description: 'Per-brand cost assumptions, ladders and reports on margin.',
        points: [
          'Filament, machine-hour and overhead assumptions per brand',
          'Reports of every design’s cost against its price',
        ],
        icon: Receipt,
        tag: 'Costing',
      },
    ],
  },
  {
    id: 'registry',
    eyebrow: 'Product registry',
    title: 'A new personalised product without a code change',
    intro:
      'The registry says what each product is made of and how to make it: which OpenSCAD design file each part prints from, and which order field fills which variable.',
    items: [
      {
        title: 'Products, SKUs and parts',
        description: 'Imported from Shopify, so every order line matches a product.',
        points: [
          'One product, many SKUs (colours, sizes, packs)',
          'Parts per product - a combo prints a plank, a rose and a keychain',
          'Bundles: each item is its own product with its own job',
        ],
        icon: Boxes,
        tag: 'Registry',
      },
      {
        title: 'Design files & field mapping',
        description: 'Versioned .scad files, filled from the customer’s answers.',
        points: [
          'Order field → OpenSCAD variable, per product or per SKU',
          'Text, number and count fields; required, optional and defaults',
          'Colour schemes per part, and self-coloured designs',
          'A file that does not declare a mapped variable is refused',
        ],
        icon: FileCode2,
        tag: 'Registry',
      },
      {
        title: 'Components & slicing settings',
        description: 'What is attached at the bench, and how each SKU slices.',
        points: [
          'Bill of materials: stock parts per product and per SKU',
          'Slicer profile per SKU, from a machine-class default',
        ],
        icon: Layers,
        tag: 'Registry',
      },
    ],
  },
  {
    id: 'production',
    eyebrow: 'Orders & production',
    title: 'From a Shopify order to a print-ready model, automatically',
    intro:
      'Orders arrive on their own, become one job per printed part, and each job renders its own 3D model from the registry - with the customer’s name already on it.',
    items: [
      {
        title: 'Order sync',
        description: 'New Shopify orders reach the floor within a minute or two.',
        points: [
          'A quick pull every minute of orders updated since the last one',
          'A full pull every 10 minutes for status changes',
          'Bundle lines arrive as their items, each keeping only its own fields',
        ],
        icon: ShoppingBag,
        tag: 'Orders',
      },
      {
        title: 'Jobs & model generation',
        description: 'One job per printed part, rendered by OpenSCAD on a worker.',
        points: [
          'Jobs named for what they print: JOB-116755-PLANK, -ROSE, -KEYCHAIN',
          'Coloured 3MF models, measured and stored with their inputs',
          'Rebuild a job’s model from its page; held jobs explain why',
        ],
        icon: Cpu,
        tag: 'Production',
      },
      {
        title: 'Personalisation confirmation',
        description: 'The customer checks their name before anything prints.',
        points: [
          'A personal link on WhatsApp with a preview of their product',
          'Corrections flow back into the job and its model',
        ],
        icon: MessageCircle,
        tag: 'Production',
      },
      {
        title: 'Product Creation',
        description: 'Build print files for products made by hand on demand.',
        points: [
          'Photo frames, moon lamps, combos, Duo Snap, date planks',
          'Any registry product from any order, as 3MF or ZIP',
        ],
        icon: Wand2,
        tag: 'Production',
      },
      {
        title: 'Bulk orders & inventory',
        description: 'Corporate orders and the shelf they draw on.',
        points: [
          'Bulk orders from a sheet, approved into jobs',
          'Filament and component stock, synced with the printers',
        ],
        icon: Package,
        tag: 'Production',
      },
    ],
  },
  {
    id: 'printing',
    eyebrow: 'Batches & printing',
    title: 'Beds packed by colour, sent to the right printer',
    intro:
      'Jobs are grouped onto print beds first-come-first-served by colour, packed onto a plate the printer can actually reach, and dispatched to the fleet through BambuBuddy.',
    items: [
      {
        title: 'Batch planner',
        description: 'Turns waiting jobs into beds, oldest order first.',
        points: [
          'Grouped by material, colour and nozzle',
          'A bed locks at 3+ units with a free printer, up to 5 units',
          'Bed class by size: P2S, then H2C, then A2L if a part does not fit',
        ],
        icon: LayoutGrid,
        tag: 'Batches',
      },
      {
        title: 'Merged plates',
        description: 'Every job’s model placed on one plate, in its colours.',
        points: [
          'Guillotine bed packing, largest part first',
          'Identical products laid in one tidy column',
          'Two-colour plates kept inside both nozzles’ reach',
        ],
        icon: ScanLine,
        tag: 'Batches',
      },
      {
        title: 'Machine management',
        description: 'The fleet, its queue and what came off the bed.',
        points: [
          'Live printer status and camera through BambuBuddy',
          'Slice, upload and queue a bed to a chosen printer',
          'Print completion recorded from the printer’s own history',
        ],
        icon: Printer,
        tag: 'Machines',
      },
    ],
  },
  {
    id: 'fulfilment',
    eyebrow: 'Fulfilment',
    title: 'Checked, packed and followed to the door',
    intro:
      'After printing, every job passes assembly, QC and packaging stations, then ships through Delhivery with tracking and failed-delivery handling.',
    items: [
      {
        title: 'Assembly, QC & packaging',
        description: 'Station queues for every step after the printer.',
        points: [
          'Assembly and finishing checks per job',
          'QC pass or fail with a reason; failures go to reprint',
          'Packaging station with the order’s full contents',
        ],
        icon: ClipboardCheck,
        tag: 'Stations',
      },
      {
        title: 'Shipping & NDR',
        description: 'Delhivery shipments, tracking and exceptions.',
        points: [
          'Shipments and tracking per order',
          'Non-delivery reports with re-attempt and address actions',
          'Reverse pickups for returns',
        ],
        icon: Truck,
        tag: 'Shipping',
      },
      {
        title: 'Damage & reprints',
        description: 'A damaged parcel becomes a reprint, not a lost customer.',
        points: [
          'Customers report damage with photos from a WhatsApp link',
          'One click turns a claim into a reprint job',
        ],
        icon: RefreshCcw,
        tag: 'Support',
      },
    ],
  },
  {
    id: 'agent',
    eyebrow: 'Agent',
    title: 'An agent that calls back abandoned checkouts',
    intro:
      'Customers who leave at checkout get a call from a voice agent in their own language, then a WhatsApp message with a discount - and every call is logged with its transcript.',
    items: [
      {
        title: 'Abandoned-checkout calls',
        description: 'Win-back calls through Sarvam’s voice agent.',
        points: [
          'A first call, then a follow-up, on a schedule',
          'Opens in the language of the customer’s state',
          'Recovered checkouts are recognised and never called again',
        ],
        icon: Phone,
        tag: 'Agent',
      },
      {
        title: 'Call logs & transcripts',
        description: 'Every call’s outcome, summary and transcript.',
        points: ['Disposition and summary from the agent', 'Full transcript per call'],
        icon: Mic,
        tag: 'Agent',
      },
      {
        title: 'WhatsApp bot',
        description: 'Answers order questions on WhatsApp, day and night.',
        points: [
          'Order status, personalisation and damage flows',
          'Message logs and notices editable from the dashboard',
        ],
        icon: MessageCircle,
        tag: 'Agent',
      },
    ],
  },
  {
    id: 'admin',
    eyebrow: 'Workspace',
    title: 'Roles, brands and the books',
    intro:
      'Several brands share one workspace, each person sees only what their role allows, and old data is cleaned up on schedule with a summary left behind.',
    items: [
      {
        title: 'Roles & permissions',
        description: 'Six roles, 38 permissions, enforced by the backend.',
        points: [
          'Admin, Designer, Project Lead, Performance Marketer, Operator, Packaging & QC',
          'Invites by email; a role change applies within minutes',
        ],
        icon: Users,
        tag: 'Team',
      },
      {
        title: 'Brands & integrations',
        description: 'Each brand connects its own store and channels.',
        points: [
          'Shopify, WhatsApp, Sarvam, Delhivery and Google per brand',
          'Credentials encrypted at rest',
        ],
        icon: ShieldCheck,
        tag: 'Settings',
      },
      {
        title: 'Accounts report & retention',
        description: 'The daily numbers, and a tidy database.',
        points: [
          'Accounts report by email',
          'Orders, jobs and batches older than 30 days are removed',
          'Each removed day leaves a sales and printing summary',
        ],
        icon: Timer,
        tag: 'Settings',
      },
    ],
  },
]

/** The headline promises, one line each, above the feature groups. */
export const FEATURE_HIGHLIGHTS: readonly { label: string; icon: LucideIcon }[] = [
  { label: 'Orders in within ~1 minute', icon: Sparkles },
  { label: 'Every price from the slicer', icon: Calculator },
  { label: 'Every job its own 3D model', icon: Cpu },
  { label: 'Every parcel tracked to the door', icon: PackageCheck },
]
