import type { JSX } from 'react'

import type { CheckoutAddress as Address } from '@/lib/validators/abandoned-checkouts'

interface CheckoutAddressProps {
  label: string
  address: Address | null
}

/** One address, laid out the way it would be written on a parcel. */
export function CheckoutAddress({ label, address }: CheckoutAddressProps): JSX.Element {
  const lines = address
    ? [
        address.name,
        address.address1,
        address.address2,
        [address.city, address.province, address.zip].filter(Boolean).join(', '),
        address.country,
        address.phone,
      ].filter(Boolean)
    : []

  return (
    <div className="flex flex-col gap-1">
      <span className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      {lines.length > 0 ? (
        <address className="text-foreground text-sm not-italic">
          {lines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : (
        <span className="text-muted-foreground text-sm">Not given</span>
      )}
    </div>
  )
}
