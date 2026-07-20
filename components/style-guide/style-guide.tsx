import type { ReactNode, JSX } from 'react'

import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/style-guide/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataValue } from '@/components/ui/data-value'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Stat } from '@/components/ui/stat'
import { StatusPill } from '@/components/ui/status-pill'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const SWATCHES = [
  { name: 'background', className: 'bg-background' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-muted', className: 'bg-surface-muted' },
  { name: 'foreground', className: 'bg-foreground' },
  { name: 'muted-foreground', className: 'bg-muted-foreground' },
  { name: 'border-strong', className: 'bg-border-strong' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'danger', className: 'bg-danger' },
]

const GIFTING_LADDER = [
  { sp: '₹999', cp: '₹250', pct: '25%' },
  { sp: '₹1,299', cp: '₹325', pct: '25%' },
  { sp: '₹1,499', cp: '₹375', pct: '25%' },
  { sp: '₹1,999', cp: '₹500', pct: '25%' },
  { sp: '₹2,499', cp: '₹625', pct: '25%' },
  { sp: '₹2,999', cp: '₹750', pct: '25%' },
]

function Section({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-foreground text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{caption}</p>
      </div>
      {children}
    </section>
  )
}

function ColorSection(): JSX.Element {
  return (
    <Section
      title="Colour"
      caption="Ivory and ink; saturation reserved for status and one royal blue signal."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SWATCHES.map(s => (
          <div key={s.name} className="flex flex-col gap-1.5">
            <div className={`border-border h-14 rounded-md border ${s.className}`} />
            <span className="text-muted-foreground font-mono text-xs">{s.name}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function TypeSection(): JSX.Element {
  return (
    <Section
      title="Type"
      caption="Three fonts, one job each. Mona Sans displays, Geist Sans interfaces, Geist Mono counts."
    >
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-display text-foreground text-4xl sm:text-5xl">
              Costing that reads like an <em className="text-accent">instrument</em>.
            </p>
            <p className="text-subtle-foreground font-mono text-xs">
              text-display · Mona Sans · display sizes only
            </p>
          </div>
          <div className="border-border flex flex-col gap-3 border-t pt-4">
            <p className="text-muted-foreground max-w-prose text-sm">
              The interface stays quiet so the numbers lead. The display face appears once per page,
              at the top of the hierarchy, and never below it: no labels, no table headers, no body
              copy. Everything you actually operate is Geist Sans.
            </p>
            <p className="text-subtle-foreground font-mono text-xs">
              font-sans · Geist Sans · every label, control and paragraph
            </p>
          </div>
          <div className="border-border flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-wrap items-baseline gap-6">
              <DataValue value="₹240" className="text-xl" />
              <DataValue value="2h 14m" className="text-xl" />
              <DataValue value="62" unit="g" className="text-xl" />
              <DataValue value="4" unit="/bed" className="text-xl" />
              <DataValue value="25.0" unit="%" className="text-xl" />
            </div>
            <p className="text-subtle-foreground font-mono text-xs">
              font-mono · Geist Mono · tabular, so columns of figures align
            </p>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function ControlsSection(): JSX.Element {
  return (
    <Section title="Controls" caption="Buttons, status and inputs — the interactive vocabulary.">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Approve design</Button>
          <Button variant="secondary">Send back</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Reject</Button>
          <Button variant="link">View report</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status="green" />
          <StatusPill status="yellow" />
          <StatusPill status="red" />
          <Badge tone="accent">Gifting</Badge>
          <Badge tone="neutral">Decor</Badge>
          <Badge tone="success">Batchable</Badge>
          <Badge tone="warning">Needs revision</Badge>
          <Badge tone="outline">PLA</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Product name" htmlFor="pn" hint="Shown on Shopify">
            <Input id="pn" placeholder="Personalised name lamp" />
          </Field>
          <Field label="Brand" htmlFor="br">
            <Select id="br" defaultValue="gifting">
              <option value="gifting">Gifting</option>
              <option value="decor">Decor</option>
            </Select>
          </Field>
          <Field label="Colour count" htmlFor="cc" hint="Drives purge waste">
            <Input id="cc" type="number" defaultValue={3} data-numeric="true" />
          </Field>
        </div>
        <Field label="Notes for Project Lead" htmlFor="nt">
          <Textarea id="nt" placeholder="Anything the lead should know before pricing…" />
        </Field>
      </div>
    </Section>
  )
}

function ReportSection(): JSX.Element {
  return (
    <Section title="In context" caption="A designer pre-check report — the system's core artefact.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Design CP" value="₹240" hint="Target ≤ ₹250" />
        <Stat label="CP of SP" value="25.0%" hint="Within ≤ 25% rule" />
        <Stat label="Machine / unit" value="1.38h" hint="4 units per bed" />
        <Stat label="Filament" value="62g" hint="+ 8g purge" />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Aarav name lamp — v3</CardTitle>
            <CardDescription>Gifting · PLA · 3 colours · aarav-lamp.3mf</CardDescription>
          </div>
          <StatusPill status="green" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Design CP as share of ₹999 selling price</span>
              <DataValue value="25.0" unit="%" />
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div className="bg-success h-full rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">Suitable for ₹999</Badge>
            <Badge tone="neutral">Batch 4 / bed</Badge>
            <Badge tone="neutral">Low support</Badge>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function LadderSection(): JSX.Element {
  return (
    <Section title="Data" caption="Gifting approval ladder — figures right-aligned in mono.">
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Selling price</TableHeaderCell>
              <TableHeaderCell className="text-right">Max Design CP</TableHeaderCell>
              <TableHeaderCell className="text-right">CP ceiling</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {GIFTING_LADDER.map(row => (
              <TableRow key={row.sp}>
                <TableCell className="font-mono tabular-nums">{row.sp}</TableCell>
                <TableCell numeric>{row.cp}</TableCell>
                <TableCell numeric className="text-muted-foreground">
                  {row.pct}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Section>
  )
}

export function StyleGuide(): JSX.Element {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-muted-foreground max-w-prose text-sm">
            Editorial Ink - the design language for Tensor&apos;s costing, pricing and approval
            workspace.
          </p>
        </div>
        <ThemeToggle />
      </header>
      <ColorSection />
      <TypeSection />
      <ControlsSection />
      <ReportSection />
      <LadderSection />
    </div>
  )
}
