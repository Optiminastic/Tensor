import type { JSX } from 'react'

import { GuideSection } from './guide-section'

const GROUPS: { name: string; swatches: { name: string; className: string }[] }[] = [
  {
    name: 'Theme - follows light and dark',
    swatches: [
      { name: 'background', className: 'bg-background' },
      { name: 'surface', className: 'bg-surface' },
      { name: 'surface-muted', className: 'bg-surface-muted' },
      { name: 'foreground', className: 'bg-foreground' },
      { name: 'muted-foreground', className: 'bg-muted-foreground' },
      { name: 'border-strong', className: 'bg-border-strong' },
    ],
  },
  {
    name: 'Landing fills - the same in both themes',
    swatches: [
      { name: 'landing-sky', className: 'bg-landing-sky' },
      { name: 'landing-sky-deep', className: 'bg-landing-sky-deep' },
      { name: 'landing-lime', className: 'bg-landing-lime' },
      { name: 'landing-ink', className: 'bg-landing-ink' },
      { name: 'landing-paper', className: 'bg-landing-paper' },
    ],
  },
  {
    name: 'Status - saturation means something',
    swatches: [
      { name: 'success', className: 'bg-success' },
      { name: 'warning', className: 'bg-warning' },
      { name: 'danger', className: 'bg-danger' },
    ],
  },
]

/** Every colour token, grouped by how it behaves across the two themes. */
export function ColourSection(): JSX.Element {
  return (
    <GuideSection
      title="Colour"
      caption="Ink, lime and sky, on a ground that follows the theme. Saturated colour marks state, never decoration; blue appears only where something is under way."
    >
      <div className="flex flex-col gap-6">
        {GROUPS.map(group => (
          <div key={group.name} className="flex flex-col gap-3">
            <p className="text-sm font-medium">{group.name}</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {group.swatches.map(swatch => (
                <div key={swatch.name} className="flex flex-col gap-1.5">
                  <div className={`ring-border h-14 rounded-2xl ring-1 ${swatch.className}`} />
                  <span className="text-muted-foreground font-mono text-xs">{swatch.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GuideSection>
  )
}
