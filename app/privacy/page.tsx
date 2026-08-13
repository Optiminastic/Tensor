import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'

export const metadata: Metadata = { title: 'Privacy Policy - Tensor' }

// The policy body as data, so the page component stays small. Each section is a
// heading plus a paragraph describing one aspect of how Tensor handles store data.
const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: 'What data we access',
    body: (
      <>
        On stores you explicitly connect, and only through the permissions you grant, Tensor
        accesses: <strong>products</strong> (to create, read, and update the listings it prices and
        publishes), <strong>inventory</strong> (to read and set stock for those products), and{' '}
        <strong>orders</strong> (to read paid orders for production planning and cost
        reconciliation).
      </>
    ),
  },
  {
    title: 'How we use it',
    body: (
      <>
        We use this data solely to calculate manufacturing cost, generate prices, publish and update
        product listings, and plan production for the connected store. We do not sell, rent, or
        share your data with third parties for their own purposes.
      </>
    ),
  },
  {
    title: 'Storage and security',
    body: (
      <>
        Access tokens are encrypted at rest, and all data is transmitted over encrypted connections
        (HTTPS). Access is limited to the store owner and authorised members of your Tensor
        workspace.
      </>
    ),
  },
  {
    title: 'Data retention',
    body: (
      <>
        We retain connected-store data only as long as needed to provide the service. When you
        disconnect the app, its access token is revoked and associated data is removed within 30
        days.
      </>
    ),
  },
  {
    title: 'Your control',
    body: (
      <>
        You can disconnect Tensor at any time from your store&rsquo;s Settings &rarr; Apps, which
        immediately revokes its access. To request deletion of any remaining data, contact us below.
      </>
    ),
  },
  {
    title: 'Contact',
    body: (
      <>
        Questions about this policy or your data: <strong>support@optiminastic.com</strong>.
      </>
    ),
  },
]

/**
 * Public privacy policy. Required for the Shopify app listing and linked from the
 * app footer. Describes what Shopify data Tensor accesses and how it is handled.
 */
export default function PrivacyPage(): JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated 12 August 2026</p>
      </div>

      <p className="text-foreground text-sm leading-relaxed">
        Tensor (&ldquo;the app&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by
        Optiminastic. Tensor is a costing, pricing, and publishing tool that connects to a
        merchant&rsquo;s Shopify store to help price and list products. This policy explains what
        data the app accesses and how it is handled.
      </p>

      {SECTIONS.map(section => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-foreground text-lg font-semibold">{section.title}</h2>
          <p className="text-foreground text-sm leading-relaxed">{section.body}</p>
        </section>
      ))}
    </main>
  )
}
