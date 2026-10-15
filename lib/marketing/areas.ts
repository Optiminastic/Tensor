import {
  Bot,
  Box,
  Coins,
  Factory,
  LayoutDashboard,
  type LucideIcon,
  Truck,
  Users,
} from 'lucide-react'

/** One page inside an area of the dashboard, and what it is for. */
export interface AreaPage {
  name: string
  does: string
}

/**
 * One area of the Tensor dashboard, described for the public site. The same
 * list drives the homepage's "Inside Tensor" cards and the Product page, so
 * the two can never disagree. Every line describes something the dashboard
 * really does - no invented features, figures or customers.
 */
export interface Area {
  /** Doubles as the Product page anchor: /product#designs. */
  key: string
  name: string
  icon: LucideIcon
  /** One line, for the homepage card. */
  summary: string
  /** A short paragraph, for the Product page. */
  detail: string
  pages: AreaPage[]
}

export const AREAS: Area[] = [
  {
    key: 'overview',
    name: 'Overview',
    icon: LayoutDashboard,
    summary: 'The brand at a glance: the floor, revenue and what needs a person.',
    detail:
      'The first screen after signing in. It shows what is on the print floor right now, how revenue has moved over the last eight weeks, which products sell most, and the jobs someone has to unblock.',
    pages: [
      {
        name: 'On the print floor',
        does: 'Jobs in production, printers printing, and what was completed this week.',
      },
      {
        name: 'Revenue and top products',
        does: 'Gross revenue with its weekly trend, and the products made most.',
      },
      {
        name: 'Needs attention',
        does: 'Held and overdue jobs, each one a link to the job itself.',
      },
    ],
  },
  {
    key: 'designs',
    name: 'Designs',
    icon: Box,
    summary: 'Upload a model; get its true cost, a verdict and a price.',
    detail:
      "A designer uploads an STL, 3MF or STEP file. Tensor slices it and costs it from the slicer itself - print time, filament, purge and support - then gives a Green, Yellow or Red pre-check and a selling price snapped to the brand's price ladder. A Project Lead reviews it, and an approved design is published to Shopify.",
    pages: [
      {
        name: 'All designs',
        does: 'Every design as a card, with its status and cover, in a grid or a table.',
      },
      {
        name: 'Upload design',
        does: 'The model, a cover photo (its background removed on-device) and the print settings.',
      },
      {
        name: 'Design detail',
        does: "The cost breakdown, the slicer's facts, a 3D and layer preview, and the review decision.",
      },
      {
        name: 'Drafts, submitted, approved, archived',
        does: 'The same list, filtered to one step of the review.',
      },
    ],
  },
  {
    key: 'costing',
    name: 'Costing',
    icon: Coins,
    summary: 'Sales from Shopify, and the rules every price is worked out from.',
    detail:
      "Cost reports read the brand's real Shopify orders. Pricing rules hold the cost rates, the fixed costs every order carries, and the margins - ad spend, team, overhead and target profit - that decide how much of a price is left for cost.",
    pages: [
      {
        name: 'Cost reports',
        does: 'Gross revenue and its trend, average order value, revenue by payment status, top products.',
      },
      {
        name: 'Pricing rules',
        does: 'Cost rates, fixed costs per order and margins. Change them and the next slice reprices.',
      },
    ],
  },
  {
    key: 'production',
    name: 'Production',
    icon: Factory,
    summary: 'From a Shopify order to a packed parcel: jobs, beds, printers, stations.',
    detail:
      'Every Shopify order becomes production jobs. Jobs are packed onto print beds, sent to the Bambu Lab printers, then move through assembly, finishing, quality check and packing. The overview shows the whole pipeline and where work is piling up.',
    pages: [
      {
        name: 'Overview',
        does: 'The pipeline stage by stage, the busiest stage, the live printer fleet and low filament.',
      },
      {
        name: 'Orders',
        does: 'Orders imported from Shopify, with their items, personalisation and payment.',
      },
      {
        name: 'Production jobs',
        does: 'One job per item to print, with its model, personalisation and status.',
      },
      {
        name: 'Batch management',
        does: 'Jobs packed onto print beds - made automatically or by hand - approved and sent to a printer.',
      },
      {
        name: 'Machine management',
        does: 'Each printer live: what it is printing, how far through, its queue and history.',
      },
      {
        name: 'Packaging',
        does: 'The stations after printing: assembly, finishing, quality check, packing and dispatch.',
      },
      { name: 'Inventory', does: 'Filament and other stock, each with a reorder level.' },
      {
        name: 'Bulk orders',
        does: "Quotations for businesses ordering at volume, priced from the brand's Shopify.",
      },
      {
        name: 'Registry',
        does: 'What each product is made of and what one costs: products, components, designs.',
      },
    ],
  },
  {
    key: 'agent',
    name: 'Agent',
    icon: Bot,
    summary: 'Win back abandoned checkouts with a voice agent and messages.',
    detail:
      'When a customer leaves a basket, the agent can call them and follow up with a message. Every call and message is kept with the checkout it was about, so the question "what did we do about this cart" has one answer.',
    pages: [
      {
        name: 'Abandoned checkout',
        does: 'Baskets from the last 30 days, each with the customer, the call and the messages sent.',
      },
    ],
  },
  {
    key: 'shipping',
    name: 'Shipping',
    icon: Truck,
    summary: 'Every parcel after it leaves: delivered, delayed or coming back.',
    detail:
      'Shipments booked with Delhivery are tracked here, so a failed delivery or a return to origin is seen and acted on rather than found out later.',
    pages: [
      {
        name: 'Deliveries',
        does: 'Each shipment with its status, why it failed if it did, and whether it is returning.',
      },
    ],
  },
  {
    key: 'workspace',
    name: 'Workspace',
    icon: Users,
    summary: 'The team, their roles, the brands and their connections.',
    detail:
      'Admins invite people by email and give them a role; what each role may see and do is enforced by the backend, not just hidden in the screen. Each brand keeps its own price ladder, cost thresholds and store connection.',
    pages: [
      { name: 'Team', does: 'Invite teammates and manage their roles.' },
      {
        name: 'Settings',
        does: "The workspace, each brand's ladder and CP thresholds, and its integrations.",
      },
    ],
  },
]

/** The path one design takes, shown as a strip on the Product page. */
export const PIPELINE_STEPS = [
  'Upload',
  'Cost',
  'Pre-check',
  'Price',
  'Approve',
  'Order',
  'Batch',
  'Print',
  'Finish and QC',
  'Pack',
  'Ship',
]
