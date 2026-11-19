import type { JSX, ReactNode } from 'react'

import { TabsDemo } from '@/components/style-guide/tabs-demo'
import { ThemeToggle } from '@/components/style-guide/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataValue } from '@/components/ui/data-value'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Stat } from '@/components/ui/stat'
import { Tag } from '@/components/ui/tag'

/** The brand palette: fixed colours, the same in light and dark. */
const BRAND = [
  { name: 'Sky deep', token: 'landing-sky-deep', hex: '#0F5FE0', className: 'bg-landing-sky-deep' },
  { name: 'Sky', token: 'landing-sky', hex: '#2D8AF7', className: 'bg-landing-sky' },
  { name: 'Sky haze', token: 'landing-sky-haze', hex: '#A9D4FF', className: 'bg-landing-sky-haze' },
  { name: 'Lime', token: 'landing-lime', hex: '#D7F75B', className: 'bg-landing-lime' },
  { name: 'Ink', token: 'landing-ink', hex: '#0E1116', className: 'bg-landing-ink' },
  { name: 'Paper', token: 'landing-paper', hex: '#F3F4F6', className: 'bg-landing-paper' },
]

/** The interface tokens: they switch with the theme toggle. */
const INTERFACE = [
  { name: 'Background', className: 'bg-background' },
  { name: 'Surface', className: 'bg-surface' },
  { name: 'Surface muted', className: 'bg-surface-muted' },
  { name: 'Foreground', className: 'bg-foreground' },
  { name: 'Muted text', className: 'bg-muted-foreground' },
  { name: 'Border', className: 'bg-border-strong' },
  { name: 'Success', className: 'bg-success' },
  { name: 'Warning', className: 'bg-warning' },
  { name: 'Danger', className: 'bg-danger' },
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
        <h2 className="text-foreground text-xl font-medium tracking-[-0.02em]">{title}</h2>
        <p className="text-muted-foreground text-sm">{caption}</p>
      </div>
      {children}
    </section>
  )
}

function BrandColours(): JSX.Element {
  return (
    <Section
      title="Brand colours"
      caption="Sky for the hero and links, lime for the one action that matters, ink for text and the dark surfaces."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {BRAND.map(s => (
          <div key={s.token} className="flex flex-col gap-2">
            <div className={`border-border h-20 rounded-2xl border ${s.className}`} />
            <span className="text-sm font-medium">{s.name}</span>
            <span className="text-muted-foreground font-mono text-xs">{s.hex}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function InterfaceColours(): JSX.Element {
  return (
    <Section
      title="Interface colours"
      caption="The workspace's surfaces, text and states. They follow the theme - try the toggle. Strong colour always means a state."
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {INTERFACE.map(s => (
          <div key={s.name} className="flex flex-col gap-2">
            <div className={`border-border h-14 rounded-xl border ${s.className}`} />
            <span className="text-muted-foreground text-xs">{s.name}</span>
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
      caption="Two faces: Inter Tight for every word, Geist Mono for every figure."
    >
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-foreground text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
              From design file to doorstep
            </p>
            <p className="text-muted-foreground text-sm">
              Inter Tight - page titles, labels, controls and body text
            </p>
          </div>
          <div className="border-border flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-wrap items-baseline gap-6">
              <DataValue value="₹1,299" className="text-xl" />
              <DataValue value="3h 18m" className="text-xl" />
              <DataValue value="42.6" unit="g" className="text-xl" />
              <DataValue value="5" unit="/bed" className="text-xl" />
              <DataValue value="23" unit="%" className="text-xl" />
            </div>
            <p className="text-muted-foreground text-sm">
              Geist Mono - money, weights, times and counts, with aligned digits
            </p>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function ActionsSection(): JSX.Element {
  return (
    <Section
      title="Buttons"
      caption="Lime on ink for the main action; soft colours for a row of actions, so each one's colour says what it does."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button>Approve design</Button>
        <Button variant="secondary">Send back</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Reject</Button>
        <Button variant="link">View report</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="soft-success">Mark printed</Button>
        <Button variant="soft-warning">Reprint</Button>
        <Button variant="soft-danger">Report a problem</Button>
        <Button variant="soft-muted">Skip</Button>
      </div>
    </Section>
  )
}

function StatusSection(): JSX.Element {
  return (
    <Section
      title="Tags and tabs"
      caption="One pill shape for every status, and pill tabs above every list."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone="success">Ready</Tag>
        <Tag tone="warning">Pending</Tag>
        <Tag tone="danger">Failed</Tag>
        <Tag tone="accent">Under way</Tag>
        <Tag tone="muted">Draft</Tag>
      </div>
      <TabsDemo />
    </Section>
  )
}

function DataSection(): JSX.Element {
  return (
    <Section
      title="Inputs and figures"
      caption="Fields for entering, tiles for reading at a glance."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Product name" htmlFor="sg-name" hint="As it appears on Shopify">
          <Input id="sg-name" placeholder="Soulmate combo" />
        </Field>
        <Field label="Material" htmlFor="sg-mat">
          <Select id="sg-mat" defaultValue="pla">
            <option value="pla">PLA</option>
            <option value="petg">PETG</option>
          </Select>
        </Field>
        <Field label="Units per bed" htmlFor="sg-units">
          <Input id="sg-units" type="number" defaultValue={5} data-numeric="true" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Design CP" value="₹298" hint="23% of price" />
        <Stat label="Print time" value="3h 18m" hint="per unit" />
        <Stat label="Filament" value="42.6g" hint="PLA, red" />
        <Stat label="On the bed" value="5" hint="H2C-02" />
      </div>
    </Section>
  )
}

/**
 * The design system as Tensor uses it today: the landing UI's brand palette,
 * the interface tokens that follow the theme, Inter Tight and Geist Mono, and
 * the shared components every page is built from. The page frame (nav, title,
 * footer) comes from the marketing shell.
 */
export function StyleGuide(): JSX.Element {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-prose text-sm">
          The colours, type and components every screen in Tensor is built from.
        </p>
        <ThemeToggle />
      </div>
      <BrandColours />
      <InterfaceColours />
      <TypeSection />
      <ActionsSection />
      <StatusSection />
      <DataSection />
    </div>
  )
}
