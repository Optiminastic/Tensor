import { ChevronRight } from 'lucide-react'
import { Fragment, type JSX } from 'react'

import { PIPELINE_STEPS } from '@/lib/marketing/areas'

/** The path one design takes through Tensor, as one row of numbered steps. */
export function PipelineFlow(): JSX.Element {
  return (
    <section aria-labelledby="pipeline-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="pipeline-title" className="text-center font-mono text-xs tracking-[0.2em] uppercase">
        <span aria-hidden className="mr-2">
          •
        </span>
        One design, start to finish
      </h2>
      <ol className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {PIPELINE_STEPS.map((step, index) => (
          <Fragment key={step}>
            <li className="bg-landing-paper flex items-center gap-2 rounded-full px-4 py-2 text-sm">
              <span className="text-landing-muted font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              {step}
            </li>
            {index < PIPELINE_STEPS.length - 1 ? (
              <ChevronRight className="text-landing-muted size-4" aria-hidden />
            ) : null}
          </Fragment>
        ))}
      </ol>
    </section>
  )
}
