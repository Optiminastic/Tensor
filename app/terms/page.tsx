import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'

export const metadata: Metadata = { title: 'Terms of Service - Tensor' }

/**
 * Public terms of service. Some app listings and review steps ask for a terms URL
 * alongside the privacy policy.
 */
export default function TermsPage(): JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated 12 August 2026</p>
      </div>

      <p className="text-foreground text-sm leading-relaxed">
        These terms govern your use of Tensor (&ldquo;the app&rdquo;), operated by Optiminastic. By
        installing or using the app, you agree to them.
      </p>

      <Section title="Use of the app">
        Tensor connects to Shopify stores you own or are authorised to manage, to calculate costs,
        generate prices, and publish and update product listings. You are responsible for the
        accuracy of the products and prices you publish through the app.
      </Section>

      <Section title="Your data">
        The app accesses only the store data needed to provide the service, as described in our{' '}
        <a href="/privacy" className="text-accent underline">
          Privacy Policy
        </a>
        . You retain ownership of your store and its data.
      </Section>

      <Section title="Availability">
        We work to keep the app available and accurate, but it is provided &ldquo;as is&rdquo;
        without warranties. We are not liable for indirect or consequential losses arising from its
        use.
      </Section>

      <Section title="Termination">
        You may stop using the app at any time by disconnecting it from your store&rsquo;s Settings
        &rarr; Apps. We may suspend access for misuse or to protect the platform.
      </Section>

      <Section title="Contact">
        Questions about these terms: <strong>support@optiminastic.com</strong>.
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-foreground text-sm leading-relaxed">{children}</p>
    </section>
  )
}
