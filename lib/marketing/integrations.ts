import {
  Code2,
  MessageCircle,
  Mic,
  Printer,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react'

/** A system Tensor works with, and what Tensor does with it. */
export interface Integration {
  name: string
  icon: LucideIcon
  /** What it is, in a few words. */
  kind: string
  /** What Tensor does with it, plainly. */
  does: string
}

/**
 * The systems Tensor talks to, named as text rather than with the companies'
 * logos. Each line is what the product really does with it.
 */
export const INTEGRATIONS: Integration[] = [
  {
    name: 'Shopify',
    icon: ShoppingBag,
    kind: 'Store',
    does: 'Orders and their personalisation come in from the store; approved designs go out as listings, with their price.',
  },
  {
    name: 'Bambu Lab',
    icon: Printer,
    kind: 'Printers and slicer',
    does: 'Every design is sliced in Bambu Studio, so its cost comes from real print time, filament, purge and support. Beds go to the printers through BambuBuddy, and each printer reports its progress and filament.',
  },
  {
    name: 'Delhivery',
    icon: Truck,
    kind: 'Shipping',
    does: 'Shipments are tracked after dispatch, so failed deliveries and returns to origin are seen in time.',
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    kind: 'Messaging',
    does: 'Customers get answers about their order and confirm their personalisation by message.',
  },
  {
    name: 'Sarvam',
    icon: Mic,
    kind: 'Voice agent',
    does: 'The agent calls customers who left a basket, and the call is kept with the checkout.',
  },
  {
    name: 'OpenSCAD',
    icon: Code2,
    kind: 'Generated models',
    does: "Personalised products, such as name planks, are built from the customer's own text.",
  },
]
