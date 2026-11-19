import { LOGOS } from '@/components/landing/content/logos'
import type { CardLogo } from '@/components/landing/info-card'

export interface Integration {
  name: string
  logo: CardLogo
  /** What kind of system it is, as a short mono tag. */
  tag: string
  /** What Tensor uses it for, in one sentence. */
  summary: string
  /** Exactly what is built, one line each. */
  built: readonly string[]
}

export interface IntegrationGroup {
  id: string
  eyebrow: string
  title: string
  intro: string
  items: readonly Integration[]
}

/** Every outside system Tensor is connected to, and what each connection does. */
export const INTEGRATION_GROUPS: readonly IntegrationGroup[] = [
  {
    id: 'commerce',
    eyebrow: 'Commerce',
    title: 'The store',
    intro:
      'Orders, products and customers come from Shopify; Tensor never asks anyone to retype them.',
    items: [
      {
        name: 'Shopify',
        logo: LOGOS.shopify,
        tag: 'Store',
        summary: 'The source of every order, product and abandoned checkout.',
        built: [
          'Store connected by OAuth; the access token is encrypted at rest',
          'Orders pulled every minute (updated since the last pull) and in full every 10 minutes',
          'Bundles split into their items, each keeping only its own customer fields',
          'Products and SKUs imported into the registry; approved designs published back',
          'Abandoned checkouts read live for the win-back agent',
        ],
      },
      {
        name: 'Google Ads & Analytics',
        logo: LOGOS.google,
        tag: 'Marketing',
        summary: 'Each brand connects its Google accounts for marketing data.',
        built: [
          'One Google OAuth flow for Ads and Analytics, scoped per provider',
          'Connections stored per brand alongside the store',
        ],
      },
    ],
  },
  {
    id: 'print-floor',
    eyebrow: 'Print floor',
    title: 'The printers and the tools that drive them',
    intro:
      'Models are rendered and sliced by real tools, and plates go to the fleet through BambuBuddy.',
    items: [
      {
        name: 'BambuBuddy',
        logo: LOGOS.bambubuddy,
        tag: 'Print farm',
        summary: 'The open-source print-farm manager in front of the Bambu Lab fleet.',
        built: [
          'Fleet sync: every printer, its state, its loaded filament and trays',
          'Slice, upload and queue a merged plate to a chosen printer',
          'Live status and camera per machine',
          'Print history read back to mark jobs printed or failed',
          'Webhooks for queue and print events',
        ],
      },
      {
        name: 'Bambu Lab',
        logo: LOGOS.bambulab,
        tag: 'Printers',
        summary: 'The printers, and Bambu Studio as the slicer.',
        built: [
          'Three machine classes - P2S, H2C (dual nozzle) and A2L - each with its own bed',
          'Bambu Studio run headless to cost designs and slice every plate',
          'Two-colour plates laid out inside the H2C’s shared nozzle reach',
        ],
      },
      {
        name: 'OpenSCAD',
        logo: LOGOS.openscad,
        tag: 'Renderer',
        summary: 'Turns each order into its own 3D model.',
        built: [
          'Versioned .scad design files uploaded through the registry',
          'Customer fields passed as variables; coloured 3MF out',
          'Rendered on a dedicated worker, measured and stored with its inputs',
        ],
      },
    ],
  },
  {
    id: 'customers',
    eyebrow: 'Customers',
    title: 'Talking to customers',
    intro: 'WhatsApp carries the links and the bot; Sarvam’s voice agent makes the calls.',
    items: [
      {
        name: 'WhatsApp Business',
        logo: LOGOS.whatsapp,
        tag: 'Messaging',
        summary: 'Meta’s WhatsApp Cloud API, for every message to a customer.',
        built: [
          'Personalisation links: the customer checks their name and preview before print',
          'Order confirmations and the order-status bot',
          'Damage claims with photos, turned into reprints',
          'Win-back messages with a discount code after a call',
        ],
      },
      {
        name: 'Sarvam AI',
        logo: LOGOS.sarvam,
        tag: 'Voice agent',
        summary: 'The voice agent that calls customers who left at checkout.',
        built: [
          'Scheduled first call and follow-up for abandoned checkouts',
          'Customer name, basket and value passed to the agent',
          'Call language chosen from the customer’s state',
          'Outcome, summary and transcript stored for every call',
        ],
      },
    ],
  },
  {
    id: 'logistics',
    eyebrow: 'Logistics & storage',
    title: 'Getting it there, and keeping the files',
    intro: 'Parcels ship through Delhivery; every file Tensor makes lives in Amazon S3.',
    items: [
      {
        name: 'Delhivery',
        logo: LOGOS.delhivery,
        tag: 'Courier',
        summary: 'Shipments, tracking and everything that goes wrong in transit.',
        built: [
          'Shipments and live tracking per order',
          'Non-delivery reports, with re-attempt and address-change actions',
          'Reverse pickups for returns and damage claims',
        ],
      },
      {
        name: 'Amazon S3',
        logo: LOGOS.s3,
        tag: 'Storage',
        summary: 'Object storage for every design file, model and plate.',
        built: [
          'Uploaded designs, .scad templates and rendered 3MF models',
          'Merged plates and sliced files per batch',
          'Models removed with their jobs by the retention sweep',
        ],
      },
    ],
  },
]
