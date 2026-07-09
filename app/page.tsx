import Link from 'next/link'

import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <Logo />
      <div className="flex flex-col gap-3">
        <Badge tone="accent" className="w-fit">
          Internal · costing &amp; pricing
        </Badge>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance">
          Slicer-driven costing and margin-safe pricing for 3D printed goods.
        </h1>
        <p className="text-muted-foreground max-w-prose text-pretty">
          Designers upload a model; Tensor estimates the true Design CP, flags inefficiencies, and
          the Project Lead generates an approved selling price against the pricing ladder.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/style-guide" className={buttonVariants({ variant: 'primary' })}>
          View design language
        </Link>
      </div>
    </main>
  )
}
