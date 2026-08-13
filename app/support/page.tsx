import type { Metadata } from 'next'
import type { JSX } from 'react'

export const metadata: Metadata = { title: 'Support - Tensor' }

/**
 * Public support/contact page, linked from the Shopify app listing so merchants
 * can reach a person for help.
 */
export default function SupportPage(): JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Support</h1>
        <p className="text-muted-foreground text-sm">We&rsquo;re here to help.</p>
      </div>

      <p className="text-foreground text-sm leading-relaxed">
        Tensor is built and supported by Optiminastic. For setup help, questions about connecting a
        store, or any issue with pricing or publishing, reach us and we&rsquo;ll get back to you.
      </p>

      <section className="border-border flex flex-col gap-2 rounded-md border p-5">
        <p className="text-foreground text-sm">
          <span className="text-muted-foreground">Email:</span>{' '}
          <strong>support@optiminastic.com</strong>
        </p>
        <p className="text-foreground text-sm">
          <span className="text-muted-foreground">Response time:</span> within 1&ndash;2 business
          days
        </p>
      </section>

      <p className="text-muted-foreground text-sm leading-relaxed">
        To disconnect Tensor from a store at any time, open your store&rsquo;s Settings &rarr; Apps
        and remove it - this immediately revokes access.
      </p>
    </main>
  )
}
