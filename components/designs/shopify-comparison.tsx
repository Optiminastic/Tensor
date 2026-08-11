import { CircleCheck, TrendingDown, TriangleAlert } from 'lucide-react'
import type { JSX } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { inr, pct } from '@/lib/format'
import type { DesignAttributes, DesignPricing } from '@/lib/validators/designs'

// CP-as-a-share-of-price benchmark: at or under 25% is a healthy margin, up to 30%
// is tight, beyond that the cost eats too much of the price. Mirrors the brand
// CP-of-SP rules (gifting <=25%, decor <=30%); shown here as an indicative bar.
const CP_GREEN_MAX = 0.25
const CP_YELLOW_MAX = 0.3

type Health = 'good' | 'tight' | 'thin' | 'loss'

interface HealthStyle {
  label: string
  tone: 'success' | 'warning' | 'danger'
  color: string
  Icon: typeof CircleCheck
}

const HEALTH: Record<Health, HealthStyle> = {
  good: { label: 'Healthy margin', tone: 'success', color: 'var(--success)', Icon: CircleCheck },
  tight: { label: 'Tight margin', tone: 'warning', color: 'var(--warning)', Icon: TriangleAlert },
  thin: { label: 'Thin margin', tone: 'danger', color: 'var(--danger)', Icon: TriangleAlert },
  loss: { label: 'Selling below cost', tone: 'danger', color: 'var(--danger)', Icon: TrendingDown },
}

const TONE_PILL: Record<HealthStyle['tone'], string> = {
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
}

function healthOf(cpPct: number, price: number, cp: number): Health {
  if (price <= 0 || cp >= price) return 'loss'
  if (cpPct <= CP_GREEN_MAX) return 'good'
  if (cpPct <= CP_YELLOW_MAX) return 'tight'
  return 'thin'
}

// money formats a value in the listing's currency: INR gets the ₹ treatment, any
// other currency is shown with its code so the comparison never lies about units.
function money(value: number, currency: string): string {
  if (!currency || currency.toUpperCase() === 'INR') return inr(value)
  return `${currency} ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

interface ShopifyComparisonProps {
  pricing: DesignPricing
  attributes: DesignAttributes
}

/**
 * For a design imported from a Shopify listing: the live listing price beside the
 * true Design CP and Tensor's recommended price, with a bar showing how much of the
 * Shopify price the cost consumes. Answers "is what we already sell this for
 * margin-safe against its real cost?".
 */
export function ShopifyComparison({
  pricing,
  attributes,
}: ShopifyComparisonProps): JSX.Element | null {
  const currency = attributes.shopify_currency ?? 'INR'
  const min = Number(attributes.shopify_min_price)
  const max = Number(attributes.shopify_max_price)
  const price = Number.isFinite(min) && min > 0 ? min : max

  if (!Number.isFinite(price) || price <= 0) return null

  const cp = pricing.design_cp
  const cpPct = cp / price
  const margin = price - cp
  const marginPct = margin / price
  const health = healthOf(cpPct, price, cp)
  const style = HEALTH[health]
  const belowRecommended = pricing.recommended_sp !== null && price < pricing.recommended_sp
  const priceLabel =
    Number.isFinite(max) && max > 0 && max !== min
      ? `${money(min, currency)} - ${money(max, currency)}`
      : money(price, currency)

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Shopify price check</CardTitle>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_PILL[style.tone]}`}
        >
          <style.Icon className="size-3.5" aria-hidden />
          {style.label}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Shopify price" value={priceLabel} />
          <Stat label="Design CP (true cost)" value={inr(cp)} />
          <Stat
            label="Recommended SP"
            value={pricing.recommended_sp !== null ? inr(pricing.recommended_sp) : '—'}
          />
        </div>

        <CostShareMeter cpPct={cpPct} color={style.color} />

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            Margin at the Shopify price{' '}
            <span className="text-foreground font-mono tabular-nums">
              {money(margin, currency)}
            </span>{' '}
            <span className="text-subtle-foreground font-mono tabular-nums">
              ({pct(marginPct)})
            </span>
          </span>
          {belowRecommended && pricing.recommended_sp !== null ? (
            <span className="text-warning">
              Below Tensor&apos;s recommended {inr(pricing.recommended_sp)} - likely underpriced.
            </span>
          ) : null}
        </div>

        {currency.toUpperCase() !== 'INR' ? (
          <p className="text-subtle-foreground text-xs">
            The listing is in {currency}; the cost figures are in INR, so this comparison is
            approximate.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface CostShareMeterProps {
  cpPct: number
  color: string
}

// CostShareMeter draws the cost as a share of the Shopify price on a single track,
// with benchmark ticks at the 25% / 30% CP thresholds. One value, one hue (the
// status colour), directly labelled - no legend needed.
function CostShareMeter({ cpPct, color }: CostShareMeterProps): JSX.Element {
  const fill = Math.min(Math.max(cpPct, 0), 1) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-subtle-foreground flex items-center justify-between text-xs">
        <span className="tracking-wide uppercase">Cost as a share of the Shopify price</span>
        <span className="text-foreground font-mono tabular-nums">{pct(cpPct)}</span>
      </div>
      <div className="bg-surface-muted relative h-2.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${fill}%`, backgroundColor: color }}
        />
        <Tick at={CP_GREEN_MAX} />
        <Tick at={CP_YELLOW_MAX} />
      </div>
      <div className="text-subtle-foreground flex justify-between text-[0.65rem]">
        <span>0%</span>
        <span>green ≤25% · yellow ≤30%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// Tick marks a benchmark threshold on the meter track.
function Tick({ at }: { at: number }): JSX.Element {
  return (
    <span
      aria-hidden
      className="bg-border-strong absolute top-0 h-full w-px"
      style={{ left: `${at * 100}%` }}
    />
  )
}
