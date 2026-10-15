import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AgentDailyChart } from '@/components/agent/agent-daily-chart'
import { AgentPeriodPicker } from '@/components/agent/agent-period-picker'
import { AgentReturnSummary } from '@/components/agent/agent-return-summary'
import { AgentStatRow } from '@/components/agent/agent-stat-row'
import { RecentCallsTable } from '@/components/agent/recent-calls-table'
import { RecoveryFunnel } from '@/components/agent/recovery-funnel'
import { periodLabel, resolvePeriod } from '@/components/production/date-range'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { AGENT_LIVE_SINCE, buildAgentOverview } from '@/lib/agent-overview'
import { type PeriodSearch, periodFromSearch } from '@/lib/agent-period'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'
import {
  AbandonedCheckoutsServiceError,
  listAbandonedCheckouts,
} from '@/services/abandoned-checkouts.service'
import { type AgentData, NO_AGENT_DATA, loadAgentData } from '@/services/agent-data.service'

export const metadata: Metadata = { title: 'Agent Overview' }

export const dynamic = 'force-dynamic'

/** The backend returns at most this many calls; reaching it means some are missing. */
const CALL_LIST_CAP = 200

/** How far back the backend reads checkouts and calls (its default window). */
const READ_WINDOW_DAYS = 30

interface AgentOverviewPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<PeriodSearch>
}

/**
 * What the win-back agent did, what it cost, and what came back.
 *
 * Computed from the same three lists the Abandoned Checkout page reads -
 * Shopify's checkouts, Sarvam's calls, Tensor's message ledger - so the two
 * pages can never disagree. Nothing is stored. Sarvam reports no price on a
 * call, so a call's cost is its duration at the plan's rate (lib/agent-costs).
 */
export default async function AgentOverviewPage({
  params,
  searchParams,
}: AgentOverviewPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('order:read', `/dashboard/${brand}`)
  const period = periodFromSearch(await searchParams)
  const now = new Date()
  const range = resolvePeriod(period, now)

  let checkouts: AbandonedCheckout[] = []
  let checkoutsError: string | null = null
  let agent: AgentData = NO_AGENT_DATA

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    checkoutsError = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    const [response, agentData] = await Promise.all([
      listAbandonedCheckouts(token, brand).then(
        ok => ok,
        (err: unknown) =>
          err instanceof AbandonedCheckoutsServiceError
            ? err.message
            : 'Could not load abandoned checkouts.',
      ),
      loadAgentData(token, brand),
    ])
    agent = agentData
    if (typeof response === 'string') checkoutsError = response
    else checkouts = response.items
  }

  const overview = buildAgentOverview({
    checkouts,
    calls: agent.calls,
    messages: agent.messages,
    range: { from: range.from.getTime(), to: range.to.getTime() },
    now: now.getTime(),
  })
  const clipped = overview.countingFrom === AGENT_LIVE_SINCE
  const beforeLive = overview.countingTo < AGENT_LIVE_SINCE
  const summaryLabel = clipped ? `Since ${liveSinceLabel()}` : periodLabel(period, now)
  // Older than the backend reads: the figures would be quietly short.
  const beyondWindow =
    overview.countingFrom < now.getTime() - READ_WINDOW_DAYS * 86_400_000 && !beforeLive
  const problems = [checkoutsError, agent.errors.calls, agent.errors.messages].filter(
    (problem): problem is string => problem !== null,
  )

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ProductionPageHeader eyebrow="Agent" title="Agent Overview" />
        <AgentPeriodPicker value={period} />
      </div>

      {/* Each source can fail alone, and a figure built without it is wrong,
          so the page says which - rather than showing a confident zero. */}
      {problems.map(problem => (
        <p
          key={problem}
          role="alert"
          className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
        >
          {problem}
        </p>
      ))}
      {beforeLive ? (
        <p className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm">
          This period ends before the agent went live on {liveSinceLabel()}, so there is nothing to
          count. Pick a later one.
        </p>
      ) : null}
      {beyondWindow ? (
        <p className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm">
          Only the last {READ_WINDOW_DAYS} days of checkouts and calls are read, and this period
          starts earlier - its figures are lower than the real ones.
        </p>
      ) : null}
      {agent.calls.length >= CALL_LIST_CAP ? (
        <p className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm">
          Only the latest {CALL_LIST_CAP} calls are read, and that limit was reached - call counts
          and spend for the period are lower than the real figures.
        </p>
      ) : null}

      <AgentReturnSummary
        funnel={overview.funnel}
        calls={overview.calls}
        currency={overview.currency}
        periodLabel={summaryLabel}
      />
      <AgentStatRow calls={overview.calls} messages={overview.messages} />
      <RecoveryFunnel funnel={overview.funnel} currency={overview.currency} />

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-sm font-medium">Day by day</h2>
        <AgentDailyChart data={overview.daily} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-sm font-medium">Latest calls</h2>
        <RecentCallsTable brand={brand} calls={overview.recent} />
      </section>
    </main>
  )
}

/** "12 Oct, 6:09 pm", in the store's own time. */
function liveSinceLabel(): string {
  return new Date(AGENT_LIVE_SINCE).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}
