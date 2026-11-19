import {
  Calculator,
  ClipboardCheck,
  Megaphone,
  PackageCheck,
  Palette,
  Printer,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** One principle the product is built on. */
export interface Principle {
  title: string
  detail: string
  icon: LucideIcon
}

export const PRINCIPLES: readonly Principle[] = [
  {
    title: 'Measured, never estimated',
    detail:
      'Every price comes from what the slicer measured - grams of filament and minutes on the printer - so a product is never sold below what it costs to make.',
    icon: Calculator,
  },
  {
    title: 'Every print accounted for',
    detail:
      'An order becomes jobs, jobs become beds, beds go to named printers, and each step is recorded - so anyone can answer “where is this order?” in one look.',
    icon: Target,
  },
  {
    title: 'Automate the routine, show the exceptions',
    detail:
      'Orders arrive, models render and beds plan themselves. People spend their time on what needs a human: a held job, a failed print, a returned parcel.',
    icon: ClipboardCheck,
  },
  {
    title: 'Each person sees their part',
    detail:
      'A designer, an operator and a packer open the same system and see the work that is theirs - and nothing they are not meant to change.',
    icon: ShieldCheck,
  },
]

/** One role that works in Tensor every day. */
export interface Role {
  title: string
  does: string
  icon: LucideIcon
}

export const ROLES: readonly Role[] = [
  {
    title: 'Admin',
    does: 'Runs the workspace: brands, people, integrations and settings.',
    icon: ShieldCheck,
  },
  {
    title: 'Designer',
    does: 'Uploads and prices designs, and sets up products in the registry.',
    icon: Palette,
  },
  {
    title: 'Project Lead',
    does: 'Reviews designs, approves them and watches the margins.',
    icon: Users,
  },
  {
    title: 'Performance Marketer',
    does: 'Follows sales, ads and the customers the agent brings back.',
    icon: Megaphone,
  },
  {
    title: 'Operator',
    does: 'Runs the print floor: beds, printers and reprints.',
    icon: Printer,
  },
  {
    title: 'Packaging & QC',
    does: 'Checks every print, packs it and hands it to the courier.',
    icon: PackageCheck,
  },
]

/** Before and after Tensor, one line each. */
export const BEFORE_AFTER: readonly { before: string; after: string }[] = [
  {
    before: 'Prices guessed from a spreadsheet',
    after: 'Prices from the slicer, checked against margin rules',
  },
  {
    before: 'Orders copied off Shopify by hand',
    after: 'Orders in Tensor within a minute or two, on their own',
  },
  {
    before: 'Names typed into a model file one by one',
    after: 'Every job renders its own 3D model from the order',
  },
  {
    before: 'Beds arranged by eye',
    after: 'Beds packed by colour and sent to the printer that fits',
  },
  {
    before: 'Abandoned carts left behind',
    after: 'A voice agent calls back in the customer’s language',
  },
]
