# Landing Page Revamp - Design

Status: approved in chat on 2026-10-13.

## Brief

Rebuild the public landing page (`app/page.tsx`) using the layout, fonts and buttons of the "Aeline" template the user supplied as inspiration, with Tensor's own content and a 3D-printing identity.
Not a copy: the structure and type treatment carry over, the imagery and copy do not.

## Layout (top to bottom)

1. **Sky hero card**, inset with rounded corners, holding:
   - Nav: logo left, centred mono UPPERCASE links, lime pill CTA right (SIGN IN, or DASHBOARD when signed in).
   - Two-tone headline: "From design file to doorstep," / lighter "every print accounted for".
   - Subtitle, then two pill buttons: translucent "VIEW PIPELINE" and lime "GET STARTED" with a black arrow circle.
   - Print-bed carousel: Tensor screens in miniature on a curved arc (cost panel, slice metrics, packed plate, product photo, printer fleet, order, shipping, WhatsApp menu).
   - Proof line: "Costed from the slicer, never estimated."
2. **Works-with marquee**: Shopify, Bambu Lab, Delhivery, WhatsApp, OpenSCAD, Sarvam, PLA and PETG, as text wordmarks with neutral icons.
3. **About**: "• ABOUT TENSOR" eyebrow, headline with inline icon pills, last line in grey.
4. **Bento**: product-photo card with a Design CP figure, light "5 stages" card, lime "0 guesses" card, ink "6 integrations" card.
5. Footer (existing, restyled to match).

## 3D-printing identity

- The sky keeps the inspiration's blue, but its texture is fine horizontal layer lines and a fading build-plate grid instead of clouds.
- The carousel is framed as a print bed: cards sit on the arc the way parts sit on a plate.
- Product imagery is the store's own photography, product-only (no customer faces).

## Type and colour

- Display: Inter Tight (Google Fonts, OFL, loaded with `next/font`, scoped to the landing page).
- Mono: Geist Mono (already in the stack) for nav, buttons and labels.
- Colours: sky blue, lime and ink, added as landing tokens in `app/globals.css`; the dashboard's Editorial Ink tokens are untouched.

## Honesty rules

- No invented ratings, client counts or testimonials. Every figure is a product fact or a clearly illustrative screen.

## Scope

- `app/page.tsx`, `components/landing/*`, landing tokens in `app/globals.css`, images under `public/landing/`.
- Old landing components that the new page no longer uses are deleted.
- Responsive down to 360px; the marquee respects `prefers-reduced-motion`.
