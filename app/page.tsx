import Link from 'next/link'

import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

const STEPS = [
  {
    n: '01',
    title: 'Upload',
    body: 'Designer submits an STL / 3MF / STEP with material, colours and finish.',
  },
  {
    n: '02',
    title: 'Cost',
    body: 'The slicer engine returns time, filament, purge and support — the true Design CP.',
  },
  {
    n: '03',
    title: 'Pre-check',
    body: 'A Green / Yellow / Red report with concrete design improvements.',
  },
  {
    n: '04',
    title: 'Price',
    body: 'Reverse unit economics generate a margin-safe price off the ladder.',
  },
  { n: '05', title: 'Approve', body: 'The Project Lead approves and pushes the SKU to Shopify.' },
]

export default function LandingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <Link href="/login" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          Sign in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-14 sm:py-20">
        <section className="flex flex-col items-start gap-5">
          <Badge tone="accent">Internal · costing &amp; pricing</Badge>
          <h1 className="text-foreground max-w-2xl text-4xl font-semibold tracking-tight text-balance">
            Precise costing and margin-safe pricing for 3D printed goods.
          </h1>
          <p className="text-muted-foreground max-w-xl text-pretty">
            Tensor turns a design file into a slicer-accurate Design CP, flags inefficiencies before
            they ship, and generates an approved selling price against the pricing ladder.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/login" className={buttonVariants({ variant: 'primary' })}>
              Sign in
            </Link>
            <Link href="/style-guide" className={buttonVariants({ variant: 'ghost' })}>
              Design system →
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
            How it works
          </h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(step => (
              <li key={step.n} className="border-border bg-surface rounded-lg border p-4 shadow-xs">
                <span className="text-subtle-foreground font-mono text-xs">{step.n}</span>
                <h3 className="text-foreground mt-2 text-sm font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-border text-subtle-foreground mx-auto flex w-full max-w-5xl items-center justify-between gap-4 border-t px-6 py-6 text-xs">
        <span>Tensor — internal costing &amp; pricing</span>
        <span>Optiminastic</span>
      </footer>
    </div>
  )
}
