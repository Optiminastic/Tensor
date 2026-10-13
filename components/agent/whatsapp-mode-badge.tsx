import { Bot, UserRound } from 'lucide-react'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'

interface WhatsAppModeBadgeProps {
  mode: 'bot' | 'human'
}

/** Who answers this customer's next message. */
export function WhatsAppModeBadge({ mode }: WhatsAppModeBadgeProps): JSX.Element {
  return mode === 'human' ? (
    <Badge tone="accent">
      <UserRound className="size-3" aria-hidden />
      Staff
    </Badge>
  ) : (
    <Badge tone="neutral">
      <Bot className="size-3" aria-hidden />
      Bot
    </Badge>
  )
}
