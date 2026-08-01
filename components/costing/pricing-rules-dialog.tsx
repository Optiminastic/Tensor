'use client'

import { SlidersHorizontal } from 'lucide-react'
import type { JSX } from 'react'

import { PricingRulesForm } from '@/components/costing/pricing-rules-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CostAssumption } from '@/lib/validators/config'

interface PricingRulesDialogProps {
  initial: CostAssumption | null
}

/** Opens the pricing-rules editor in a dialog rather than rendering it inline. */
export function PricingRulesDialog({ initial }: PricingRulesDialogProps): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <SlidersHorizontal aria-hidden />
          Edit pricing rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pricing rules</DialogTitle>
        </DialogHeader>
        <PricingRulesForm initial={initial} />
      </DialogContent>
    </Dialog>
  )
}
