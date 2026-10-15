/** A rule Tensor is built around, and why. */
export interface Principle {
  title: string
  body: string
}

export const PRINCIPLES: Principle[] = [
  {
    title: 'Costed from the slicer',
    body: "A design's cost comes from slicing it for real - print time, filament, purge and support - plus a provision for failed prints. It is never estimated from its size.",
  },
  {
    title: 'Prices that hold up',
    body: "A selling price is worked back from the cost and the margins, snapped to the brand's approved price ladder, and checked against a 40% ad-spend stress test.",
  },
  {
    title: 'One source of truth',
    body: 'The costing, pricing and permissions live in Tensor-Core, the backend. The screens show what it decides; they never decide it themselves.',
  },
  {
    title: 'Every order followed',
    body: "An order is tracked from the moment it lands in Shopify, through the printer and the stations after it, to the customer's door - and back again if it returns.",
  },
]

/** Who uses Tensor, and what they do in it. */
export interface Role {
  name: string
  does: string
}

export const ROLES: Role[] = [
  {
    name: 'Designer',
    does: 'Uploads designs, re-slices them with new settings, and submits them for review.',
  },
  {
    name: 'Project Lead',
    does: "Reviews each design's cost and price, approves it or sends it back, and publishes it.",
  },
  { name: 'Operator', does: 'Runs the floor: jobs, print beds and the printers they are sent to.' },
  {
    name: 'Packaging and QC',
    does: 'Works the stations after printing: assembly, finishing, quality check and packing.',
  },
  {
    name: 'Admin',
    does: 'Invites the team, gives each person a role, and sets up brands and their connections.',
  },
]
