import type { JSX } from 'react'

import { BentoPhotoCard } from '@/components/landing/bento-photo-card'
import { BentoStatCard } from '@/components/landing/bento-stat-card'
import { RoleChips } from '@/components/landing/role-chips'

/**
 * The inspiration's bento of facts. Every figure is a property of the product,
 * not a claim about customers: no invented ratings or client counts.
 */
export function Bento(): JSX.Element {
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
      <BentoPhotoCard />
      <BentoStatCard
        tone="paper"
        label="From upload to approval"
        value="5 stages"
        className="lg:row-span-2"
      >
        <RoleChips />
        <p className="mt-5 text-base">
          The same inputs give the same price, to a Designer, a Project Lead and an auditor six
          months from now.
        </p>
      </BentoStatCard>
      <BentoStatCard tone="lime" label="Guesswork in a cost" value="0">
        Every number comes from the slicer, and every price snaps to a rung the team already
        approved.
      </BentoStatCard>
      <BentoStatCard tone="ink" label="Systems connected" value="6">
        Shopify, Bambu Lab, Delhivery, WhatsApp, OpenSCAD and Sarvam.
      </BentoStatCard>
    </div>
  )
}
