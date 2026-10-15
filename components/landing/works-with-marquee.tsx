import type { JSX } from 'react'

import { PartnerRow } from '@/components/landing/partner-row'

/**
 * The inspiration's logo strip. Two identical rows scroll by half their width,
 * so the loop is seamless; it stands still for anyone who prefers less motion.
 */
export function WorksWithMarquee(): JSX.Element {
  return (
    <section id="works-with" aria-label="Works with" className="overflow-hidden py-8">
      <div className="animate-landing-marquee flex w-max">
        <PartnerRow />
        <PartnerRow duplicate />
      </div>
    </section>
  )
}
