import {
  Code2,
  Layers,
  MessageCircle,
  Mic,
  Printer,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type { JSX } from 'react'

interface Partner {
  name: string
  icon: LucideIcon
}

/** The systems Tensor talks to. Text wordmarks, not the companies' logos. */
const PARTNERS: Partner[] = [
  { name: 'Shopify', icon: ShoppingBag },
  { name: 'Bambu Lab', icon: Printer },
  { name: 'Delhivery', icon: Truck },
  { name: 'WhatsApp', icon: MessageCircle },
  { name: 'OpenSCAD', icon: Code2 },
  { name: 'Sarvam', icon: Mic },
  { name: 'PLA · PETG', icon: Layers },
]

interface PartnerRowProps {
  /** The second, duplicate row exists only for the seamless loop. */
  duplicate?: boolean
}

export function PartnerRow({ duplicate }: PartnerRowProps): JSX.Element {
  return (
    <ul aria-hidden={duplicate} className="flex shrink-0 items-center gap-14 pr-14">
      {PARTNERS.map(p => (
        <li
          key={p.name}
          className="text-landing-ink/70 flex items-center gap-2 text-lg font-medium tracking-tight"
        >
          <p.icon className="size-5" aria-hidden />
          {p.name}
        </li>
      ))}
    </ul>
  )
}
