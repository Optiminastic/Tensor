---
name: tensor-ui
description: Tensor's design system, "Editorial Ink" - the tokens, typography, table and component conventions this dashboard is already built from. Load before writing or restyling ANY UI in this repo: a page, a table, a form, a badge, a dialog, a nav item, a colour, a spacing decision. Also load before reaching for frontend-design, which assumes a blank brief and will invent an identity this product already has.
---

# Tensor UI

Tensor is a production and costing dashboard for a 3D-printing workshop.
Operators read it on a shop floor, all day, to decide what to print next.

**The design language is already decided.** It is called _Editorial Ink_ and it
lives in `app/globals.css`. Your job is to extend it, not to propose one.

> If you have loaded `frontend-design`, note that it is written for a blank
> brief: "make deliberate, opinionated choices about palette and typography
> specific to this client". That work has been done. Take its advice on
> _restraint, hierarchy and avoiding templated defaults_ and ignore its advice
> to pick new typefaces or a new palette.

## Read these first

- `CLAUDE.md` - the project rules, including the typography table. They bind.
- `app/globals.css` - every token. Never a raw hex in a component.
- `components/ui/` - the primitives. Check here before building anything.

## Colour

Tokens only, light and dark both defined:

| Role     | Tokens                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Surfaces | `--background` `--surface` `--surface-muted`                              |
| Text     | `--foreground` `--muted-foreground` `--subtle-foreground`                 |
| Lines    | `--border` `--border-strong`                                              |
| Action   | `--accent` `--accent-hover` `--accent-foreground`                         |
| State    | `--success` `--warning` `--danger`                                        |
| Fills    | `--accent-subtle` `--success-subtle` `--warning-subtle` `--danger-subtle` |

**Saturated colour means something.** It marks state - ready, late, failed,
held. It is never decoration, never a brand flourish, never a gradient for its
own sake.

`--tint` is the single knob driving every `*-subtle` fill through `color-mix`.
Raising it makes every badge and pill across the product more colourful at
once. That is the lever to pull when a page reads as washed out - not a local
override on one component.

**`--border-strong` is deliberately NOT lightened.** It carries non-text
contrast (WCAG 1.4.11) on inputs and controls. Lifting it to make a page feel
airier fails that, silently.

**De-emphasis comes from size, weight and tracking, never from lower contrast.**
Every text token meets AA on the worst surface it renders on. Do not add a
lighter grey.

## Typography - three faces, one job each

| Face                                 | Where                          | Never                             |
| ------------------------------------ | ------------------------------ | --------------------------------- |
| Mona Sans, `.text-display`           | page titles, ~28px and up      | anything smaller, labels, buttons |
| Geist Sans, default                  | the whole interface            | figures                           |
| Geist Mono, `font-mono tabular-nums` | every figure - ₹, g, h, %, ids | prose                             |

At most **one** `.text-display` per screen. A second one means the hierarchy is
wrong. Never set it below ~28px: both faces are grotesques, and below display
sizes it stops reading as a signal and just looks heavy.

Identifiers - job numbers, SKUs, checkout ids - are
`font-mono text-sm whitespace-nowrap`, with the tighter `py-2`. An id that wraps
mid-number is worse than a narrow column.

## Tables

Every list is built from `components/ui/table.tsx`. **Restyling there reaches
every table at once, which is the point.** Twenty tables each choosing their own
padding is how a product stops looking like one product.

- Minimal by default: tinted header band, hairline row dividers, whitespace.
  No outer border, no vertical rules, no zebra striping.
- `<Table dense>` for a wide table - it sets a data attribute the cells read in
  CSS. Never hand-tune padding on one table's cells.
- The `numeric` prop on `TableCell` gives right-aligned mono tabular figures.
- `TableHeaderCell` takes `sortDirection` + `onSort` and handles `aria-sort`.
  Sort arrows belong only on columns someone would actually order by.
- The inner scroll shadow is a **scroll affordance**, not decoration. Wide
  tables scroll sideways with nothing on screen to say so, and readers never
  find the columns past the edge.
- Long free text: `max-w-*` + `truncate` + `title`. But `title` is unreachable
  on touch and invisible when scanning - never put something that matters
  there alone.

## Components

Check `components/ui/` before writing anything: badge, button, card,
copyable-id, data-value, dialog, dropdown-menu, field, hover-card, input,
label, popover, select, separator, sheet, stat, status-pill, switch, table,
tabs, textarea.

`FilterBar` (`components/production/filter-bar.tsx`) is the standard tabs +
search header above a table, with counts on each tab.

There is no tooltip primitive. Use `hover-card.tsx` (portalled, so a card from
the last row escapes the table's overflow) or the native `title`, with the
caveat above.

## Charts

**Load the `dataviz` skill before writing any chart code.** Charts are the
product here, not decoration. `recharts` is already a dependency. Never ship a
library default - no default palettes, gridlines, tooltips or legends. Figures
are mono tabular so axes align. Show the threshold line when one exists (the
≤25% / ≤30% CP rules, the 2-hour machine-time target).

## Writing in the interface

Tensor's copy explains, it does not announce. An empty state says _why_ it is
empty ("Shopify only records a checkout once the customer has entered their
contact details"), an error names the thing to go and fix, and a destructive
button says what it will do rather than "Submit".

Pass the backend's own `detail` string through. Tensor-Core's refusals name the
scope, the field or the missing number, and the operator is the person who can
act on that - "Request failed (422)" helps nobody.

## Hard no

- No raw hex, no inline styles, no new font, no new colour outside the tokens.
- No gradient fills for their own sake, no glassmorphism, no rainbow
  categorical palettes, no decorative motion. Restrained, precise,
  instrument-grade.
- No new UI dependency without asking.
- No `.text-display` below 28px, and never twice on a page.
- Dark mode is not optional. Every token has both; check both before done.

## Before done

`npx tsc --noEmit` and `npx eslint <your files>` must be clean. Lint the files
you touched, not the repo: it has a pre-existing CRLF/prettier conflict that
fails untouched files.
