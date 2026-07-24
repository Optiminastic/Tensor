'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type JSX } from 'react'
import { type FieldError, useForm } from 'react-hook-form'
import { z } from 'zod'

import { calculatePrice, type CalculationResult } from '@/app/dashboard/[brand]/costing/actions'
import { PriceResult } from '@/components/costing/price-result'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const FormSchema = z.object({
  print_time_hr: z.number().positive(),
  filament_g: z.number().min(0),
  effective_machine_time_hr: z.number().positive(),
  purge_g: z.number().min(0),
  electricity_kwh: z.number().min(0),
  units_per_bed: z.number().int().min(1),
  filament_cost_per_kg: z.number().min(0),
  machine_hour_cost: z.number().min(0),
  finishing_labour: z.number().min(0),
  consumables: z.number().min(0),
  electricity_cost_per_unit: z.number().min(0),
  failure_pct: z.number().min(0).max(1),
  packaging: z.number().min(0),
  shipping: z.number().min(0),
  rto_cod: z.number().min(0),
  payment_gateway: z.number().min(0),
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

interface FieldGroup {
  title: string
  fields: FieldConfig[]
}

const GROUPS: FieldGroup[] = [
  {
    title: 'Slicer metrics',
    fields: [
      { name: 'print_time_hr', label: 'Print time (h)', step: '0.1' },
      { name: 'filament_g', label: 'Filament (g)', step: '1' },
      { name: 'effective_machine_time_hr', label: 'Effective machine time (h)', step: '0.1' },
      { name: 'purge_g', label: 'Purge (g)', step: '1' },
      { name: 'electricity_kwh', label: 'Electricity (kWh)', step: '0.1' },
      { name: 'units_per_bed', label: 'Units per bed', step: '1' },
    ],
  },
  {
    title: 'Cost assumptions',
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
    fields: [
      { name: 'packaging', label: 'Packaging (₹)', step: '1' },
      { name: 'shipping', label: 'Shipping (₹)', step: '1' },
      { name: 'rto_cod', label: 'RTO / COD (₹)', step: '1' },
      { name: 'payment_gateway', label: 'Payment gateway (₹)', step: '1' },
    ],
  },
  {
    title: 'Margins',
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

// Pre-filled with the engine defaults plus a representative design, so the tool
// returns a real result immediately and the user tweaks from there.
const DEFAULTS: FormValues = {
  print_time_hr: 1.5,
  filament_g: 60,
  effective_machine_time_hr: 1.4,
  purge_g: 8,
  electricity_kwh: 0.5,
  units_per_bed: 1,
  filament_cost_per_kg: 1000,
  machine_hour_cost: 45,
  finishing_labour: 30,
  consumables: 15,
  electricity_cost_per_unit: 12,
  failure_pct: 0.06,
  packaging: 90,
  shipping: 25,
  rto_cod: 15,
  payment_gateway: 40,
  ad_spend_pct: 0.3,
  team_pct: 0.12,
  overhead_pct: 0.05,
  target_profit_pct: 0.15,
}

interface PriceCalculatorProps {
  brand: string
}

/**
 * Prices a single design against a brand: enter the slicer metrics and costs,
 * get the Design CP, the recommended selling price off the brand's ladder, and
 * the Green/Yellow/Red pre-check. Runs the pure engine in Tensor-Core.
 */
export function PriceCalculator({ brand }: PriceCalculatorProps): JSX.Element {
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: DEFAULTS })

  async function onSubmit(v: FormValues): Promise<void> {
    setError(null)
    const outcome = await calculatePrice({
      brand,
      metrics: {
        print_time_hr: v.print_time_hr,
        filament_g: v.filament_g,
        effective_machine_time_hr: v.effective_machine_time_hr,
        purge_g: v.purge_g,
        electricity_kwh: v.electricity_kwh,
        units_per_bed: v.units_per_bed,
      },
      assumptions: {
        filament_cost_per_kg: v.filament_cost_per_kg,
        machine_hour_cost: v.machine_hour_cost,
        finishing_labour: v.finishing_labour,
        consumables: v.consumables,
        electricity_cost_per_unit: v.electricity_cost_per_unit,
        failure_pct: v.failure_pct,
      },
      fixed_costs: {
        packaging: v.packaging,
        shipping: v.shipping,
        rto_cod: v.rto_cod,
        payment_gateway: v.payment_gateway,
      },
      margins: {
        ad_spend_pct: v.ad_spend_pct,
        team_pct: v.team_pct,
        overhead_pct: v.overhead_pct,
        target_profit_pct: v.target_profit_pct,
      },
    })
    if (!outcome.ok || !outcome.data) {
      setError(outcome.error ?? 'Could not price this design.')
      return
    }
    setResult(outcome.data)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {GROUPS.map(group => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
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

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Calculating…' : 'Calculate price'}
        </Button>
      </form>

      <div className="lg:sticky lg:top-6 lg:h-fit">
        {error ? (
          <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
            {error}
          </p>
        ) : result ? (
          <PriceResult result={result} />
        ) : (
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Enter a design and calculate to see its cost, price and pre-check.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
