import type { JSX } from 'react'

import type { OrderAddress, OrderRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'

/**
 * The order's context column: the note, the store's own attributes, and who it
 * is going to - the same panels Shopify shows down the right of an order.
 *
 * Customer identity is mostly empty today, and that is a permission fact rather
 * than a bug. Shopify treats a customer's name, email, phone and addresses as
 * PROTECTED CUSTOMER DATA: the Admin API returns null for every one of them
 * until the app is granted protected-data access, without failing the request.
 * So the panels render what they have and say plainly when there is nothing,
 * instead of showing blank labels that look broken.
 */
interface OrderDetailAsideProps {
  order: OrderRecord
}

function Panel({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </Card>
  )
}

function Empty({ children }: { children: React.ReactNode }): JSX.Element {
  return <p className="text-muted-foreground text-sm">{children}</p>
}

/** An address as a postal block, skipping the lines the store did not give. */
function AddressBlock({ address }: { address: OrderAddress }): JSX.Element {
  const lines = [
    address.name,
    address.address1,
    address.address2,
    [address.city, address.zip].filter(Boolean).join(' '),
    [address.province, address.country].filter(Boolean).join(', '),
    address.phone,
  ].filter((line): line is string => Boolean(line && line.trim()))

  return (
    <div className="text-muted-foreground flex flex-col text-sm">
      {lines.map(line => (
        <span key={line}>{line}</span>
      ))}
    </div>
  )
}

export function OrderDetailAside({ order }: OrderDetailAsideProps): JSX.Element {
  const contact = order.customerEmail ?? order.customerPhone
  const hasIdentity = Boolean(order.customer || contact || order.shippingAddress)

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Notes">
        {order.note ? (
          <p className="text-sm whitespace-pre-wrap">{order.note}</p>
        ) : (
          <Empty>No notes from customer</Empty>
        )}
      </Panel>

      {order.attributes.length > 0 ? (
        <Panel title="Additional details">
          <dl className="flex flex-col gap-1.5">
            {order.attributes.map((attr, i) => (
              <div key={`${attr.name}-${i}`} className="flex flex-col">
                <dt className="text-muted-foreground font-mono text-xs">{attr.name}</dt>
                <dd className="font-mono text-xs break-all">{attr.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ) : null}

      <Panel title="Customer">
        {hasIdentity ? (
          <div className="flex flex-col gap-3">
            {order.customer ? <p className="text-sm">{order.customer}</p> : null}
            {contact ? (
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-medium">Contact information</h3>
                {order.customerEmail ? (
                  <span className="text-muted-foreground text-sm break-all">
                    {order.customerEmail}
                  </span>
                ) : null}
                <span className="text-muted-foreground text-sm">
                  {order.customerPhone ?? 'No phone number'}
                </span>
              </div>
            ) : null}
            {order.shippingAddress ? (
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-medium">Shipping address</h3>
                <AddressBlock address={order.shippingAddress} />
              </div>
            ) : null}
            {order.billingAddress ? (
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-medium">Billing address</h3>
                <AddressBlock address={order.billingAddress} />
              </div>
            ) : null}
          </div>
        ) : (
          // Named as the permission gap it is, so nobody spends an afternoon
          // debugging an import that is working exactly as configured.
          <Empty>
            Shopify withholds customer details until this app is granted access to protected
            customer data. Everything else on this order imported fine.
          </Empty>
        )}
      </Panel>

      {order.tags.length > 0 ? (
        <Panel title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {order.tags.map(tag => (
              <span
                key={tag}
                className="bg-surface-muted text-muted-foreground rounded px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
