'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type JSX } from 'react'
import { type FieldError, useForm } from 'react-hook-form'
import { z } from 'zod'

import { savePricingConfig } from '@/app/dashboard/[brand]/costing/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { CostAssumption } from '@/lib/validators/config'

// Flat form; regrouped into fixed_costs / margins on submit. Percentages are
// fractions (0.30 = 30%), matching the backend.
const FormSchema = z.object({
  filament_cost_per_kg: z.number().positive(),
  electricity_cost_per_unit: z.number().min(0),
  machine_hour_cost: z.number().min(0),
  finishing_labour: z.number().min(0),
  consumables: z.number().min(0),
  failure_pct: z.number().min(0).max(1),
  packaging: z.number().min(0),
  shipping: z.number().min(0),
  rto_cod: z.number().min(0),
  payment_gateway: z.number().min(0),
  tech_allocation: z.number().min(0),
  other: z.number().min(0),
  ad_spend_pct: z.number().min(0).max(1),
  team_pct: z.number().min(0).max(1),
  overhead_pct: z.number().min(0).max(1),
  target_profit_pct: z.number().min(0).max(1),
})

type FormValues = z.infer<typeof FormSchema>

interface FieldConfig {
  name: keyof FormValues
  label: string
  step: string
  hint?: string
}

const GROUPS: { title: string; description: string; fields: FieldConfig[] }[] = [
  {
    title: 'Design CP cost rates',
    description: 'The manufacturing rates the Design CP is built from.',
    fields: [
      { name: 'filament_cost_per_kg', label: 'Filament (₹/kg)', step: '1' },
      { name: 'machine_hour_cost', label: 'Machine (₹/h)', step: '1' },
      { name: 'finishing_labour', label: 'Finishing labour (₹)', step: '1' },
      { name: 'consumables', label: 'Consumables (₹)', step: '1' },
      { name: 'electricity_cost_per_unit', label: 'Electricity (₹/unit)', step: '1' },
      { name: 'failure_pct', label: 'Failure rate', step: '0.01', hint: 'Fraction, e.g. 0.06' },
    ],
  },
  {
    title: 'Fixed and variable costs',
    description: 'Added to Design CP before the selling price is reversed out.',
    fields: [
      { name: 'packaging', label: 'Packaging (₹)', step: '1' },
      { name: 'shipping', label: 'Shipping (₹)', step: '1' },
      { name: 'rto_cod', label: 'RTO / COD (₹)', step: '1' },
      { name: 'payment_gateway', label: 'Payment gateway (₹)', step: '1' },
      { name: 'tech_allocation', label: 'Tech allocation (₹)', step: '1' },
      { name: 'other', label: 'Other (₹)', step: '1' },
    ],
  },
  {
    title: 'Margins',
    description: 'Subtracted from 1 to leave the share of price available for cost.',
    fields: [
      { name: 'ad_spend_pct', label: 'Ad spend', step: '0.01', hint: 'Fraction, e.g. 0.30' },
      { name: 'team_pct', label: 'Team', step: '0.01', hint: 'Fraction, e.g. 0.12' },
      { name: 'overhead_pct', label: 'Overhead', step: '0.01', hint: 'Fraction, e.g. 0.05' },
      {
        name: 'target_profit_pct',
        label: 'Target profit',
        step: '0.01',
        hint: 'Fraction, e.g. 0.15',
      },
    ],
  },
]

// Engine + seed defaults, used when no default set exists yet.
const DEFAULTS: FormValues = {
  filament_cost_per_kg: 1000,
  electricity_cost_per_unit: 12,
  machine_hour_cost: 45,
  finishing_labour: 30,
  consumables: 15,
  failure_pct: 0.06,
  packaging: 60,
  shipping: 50,
  rto_cod: 20,
  payment_gateway: 40,
  tech_allocation: 0,
  other: 0,
  ad_spend_pct: 0.3,
  team_pct: 0.12,
  overhead_pct: 0.05,
  target_profit_pct: 0.15,
}

function toFormValues(set: CostAssumption | null): FormValues {
  if (!set) return DEFAULTS
  return {
    filament_cost_per_kg: set.filament_cost_per_kg,
    electricity_cost_per_unit: set.electricity_cost_per_unit,
    machine_hour_cost: set.machine_hour_cost,
    finishing_labour: set.finishing_labour,
    consumables: set.consumables,
    failure_pct: set.failure_pct,
    packaging: set.fixed_costs.packaging,
    shipping: set.fixed_costs.shipping,
    rto_cod: set.fixed_costs.rto_cod,
    payment_gateway: set.fixed_costs.payment_gateway,
    tech_allocation: set.fixed_costs.tech_allocation,
    other: set.fixed_costs.other,
    ad_spend_pct: set.margins.ad_spend_pct,
    team_pct: set.margins.team_pct,
    overhead_pct: set.margins.overhead_pct,
    target_profit_pct: set.margins.target_profit_pct,
  }
}

interface PricingRulesFormProps {
  initial: CostAssumption | null
}

/**
 * Edits the cost assumptions that drive Design CP and the selling price. Saving
 * updates the default set (or creates one), so the next slice reprices against
 * these values - the price is configuration, not a hardcoded constant.
 */
export function PricingRulesForm({ initial }: PricingRulesFormProps): JSX.Element {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: toFormValues(initial),
  })

  async function onSubmit(v: FormValues): Promise<void> {
    setError(null)
    setSaved(false)
    const outcome = await savePricingConfig(initial?.id ?? null, {
      filament_cost_per_kg: v.filament_cost_per_kg,
      electricity_cost_per_unit: v.electricity_cost_per_unit,
      machine_hour_cost: v.machine_hour_cost,
      finishing_labour: v.finishing_labour,
      consumables: v.consumables,
      failure_pct: v.failure_pct,
      fixed_costs: {
        packaging: v.packaging,
        shipping: v.shipping,
        rto_cod: v.rto_cod,
        payment_gateway: v.payment_gateway,
        tech_allocation: v.tech_allocation,
        other: v.other,
      },
      margins: {
        ad_spend_pct: v.ad_spend_pct,
        team_pct: v.team_pct,
        overhead_pct: v.overhead_pct,
        target_profit_pct: v.target_profit_pct,
      },
    })
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not save the pricing rules.')
      return
    }
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {GROUPS.map(group => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{group.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.fields.map(f => (
                <Field
                  key={f.name}
                  label={f.label}
                  htmlFor={f.name}
                  hint={f.hint}
                  error={(errors[f.name] as FieldError | undefined)?.message}
                >
                  <Input
                    id={f.name}
                    type="number"
                    step={f.step}
                    data-numeric="true"
                    {...register(f.name, { valueAsNumber: true })}
                  />
                </Field>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save pricing rules'}
        </Button>
        {saved ? (
          <span role="status" className="text-success text-sm">
            Saved. New slices will use these values.
          </span>
        ) : null}
        {error ? (
          <span role="alert" className="text-danger text-sm">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  )
}
