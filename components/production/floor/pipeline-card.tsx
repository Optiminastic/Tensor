import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import { SkyBackdrop } from '@/components/landing/sky-backdrop'
import type { FlowStage, PipelineStage } from '@/lib/production/pipeline'

import { PipelineStep } from './pipeline-step'

interface PipelineCardProps {
  stages: PipelineStage[]
  bottleneck: FlowStage | null
  attentionCount: number
  jobsHref: string
}

function summary(stages: PipelineStage[], bottleneck: FlowStage | null): string {
  const busiest = stages.find(stage => stage.key === bottleneck)
  if (!busiest) return 'Nothing is waiting anywhere on the floor.'
  const noun = busiest.count === 1 ? 'job is' : 'jobs are'
  return `Most work is at ${busiest.label.toLowerCase()}: ${busiest.count} ${noun} waiting there.`
}

/**
 * The floor as one flow, from a job waiting for a bed to a packed parcel, on
 * the sky. The stage holding the most work is lit lime, so the eye lands on
 * the bottleneck before it reads a number.
 */
export function PipelineCard(props: PipelineCardProps): JSX.Element {
  const { stages, bottleneck, attentionCount, jobsHref } = props
  return (
    <section
      aria-labelledby="pipeline-title"
      className="relative isolate overflow-hidden rounded-3xl p-6 text-white sm:p-8"
    >
      <SkyBackdrop variant="deep" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="pipeline-title" className="font-mono text-xs tracking-[0.18em] uppercase">
              The pipeline, right now
            </h2>
            <p className="max-w-xl text-2xl font-medium tracking-tight text-balance">
              {summary(stages, bottleneck)}
            </p>
          </div>
          <Link
            href={jobsHref}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
          >
            {attentionCount > 0 ? `${attentionCount} need attention` : 'All production jobs'}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {stages.map((stage, index) => (
            <PipelineStep
              key={stage.key}
              stage={stage}
              index={index}
              busiest={stage.key === bottleneck}
            />
          ))}
        </ol>
        <p className="text-sm text-white">
          Every stage is live except Packed, which counts the period you picked above.
        </p>
      </div>
    </section>
  )
}
