# Project Rules — Claude Code Must Follow These Always

## Pre-flight checklist (run through this before writing ANY code)

1. Does a similar util/hook/component already exist in the codebase? Search first.
2. Will this file exceed 500 lines? If yes, plan the split before starting.
3. Is this a server or client component? Default to server. Add `"use client"` only when needed.
4. Does this belong in `features/`, `components/`, `lib/`, or `services/`? Place it correctly.
5. Will this require a new npm package? Ask the user before installing anything new.

---

## Hard rules — never violate these

### File size

- **Never create a file longer than 500 lines.** If approaching the limit, split into smaller modules before continuing.
- One component per file. No exceptions.

### Functions

- **Max 3 parameters per function.** Beyond 3, use an options object: `function foo({ a, b, c, d }: FooOptions)`
- **Max 40 lines per function body.** Extract helpers if needed.
- Always declare explicit return types on functions.

### TypeScript

- **Never use `any`.** Use `unknown` and narrow it, or define a proper type.
- Always define prop interfaces above the component in the same file.
- Use `type` for unions/primitives, `interface` for object shapes.

### Imports & exports

- **No default exports** — except in `app/` page and layout files (Next.js requires it).
- Named exports everywhere else.
- Import order: builtin → external → internal (`@/`) → relative (`./`)

### Forbidden patterns

- **Never `fetch()` directly inside a component.** All data fetching goes through `src/services/`.
- **Never use `console.log`.** Use the pino logger from `src/lib/logger.ts`.
- **Never prop-drill more than 2 levels.** Use Context or Zustand instead.
- **Never hardcode secrets or API URLs.** Use env vars validated by `src/env.ts`.
- No `// @ts-ignore` or `// @ts-nocheck` comments.
- No `!` non-null assertions unless you add a comment explaining why it's safe.

---

## Folder structure — always follow this

This project uses a root-level layout (no `src/` directory). All paths below are relative to the repo root, and `@/` in imports resolves to the repo root.

```
app/                      # Next.js App Router pages, layouts, route handlers
components/               # Shared UI components (no business logic)
└── ui/                   # Primitive UI elements (shadcn-generated)
features/                 # Feature modules — self-contained
└── [feature-name]/
    ├── components/       # Components used only by this feature
    ├── hooks/            # Hooks used only by this feature
    ├── types.ts          # Types + Zod schemas for this feature
    └── index.ts          # Public API — only export what other features need
hooks/                    # Shared hooks used across multiple features
lib/                      # Shared utilities (logger, db, auth, env...)
├── env.ts                # Type-safe env vars (t3-oss/env-nextjs)
├── auth.ts               # Better Auth server config (+ JWT/JWKS plugin)
├── auth-client.ts        # Better Auth React client
├── db.ts                 # pg Pool — Better Auth's tables ONLY
├── logger.ts             # Pino logger
├── query-client.ts       # TanStack Query client factory
└── validators/           # Zod schemas shared across features
services/                 # All external API / data-access calls — typed
stores/                   # Zustand stores
middleware.ts             # Next.js edge middleware (auth gating)
```

- Features cannot import from other features. Only from `shared/`, `lib/`, `components/`.
- If two features need the same thing, it moves to `lib/` or `components/`.

---

## The database is not yours

There is **no ORM** in this repo, and that is deliberate. `lib/db.ts` is a `pg` Pool that exists for one reason: Better Auth has to persist its own five tables (`user`, `session`, `account`, `verification`, `jwks`).

- **Never add an application query to `lib/db.ts`.** If the frontend needs domain data (designs, costing, pricing, roles, audit), that is a Tensor-Core endpoint called through `services/` — not SQL.
- **Never `import { authPool }` outside `lib/auth.ts`.** It is not a general-purpose database handle.
- **Never add Prisma, Drizzle, or another ORM back.** The backend owns the domain and is the source of truth; an ORM here invites a second, competing data layer.
- Better Auth's tables are created with `pnpm auth:migrate`. Everything else is Alembic's, in Tensor-Core.

### Server actions are a public API

A server action's arguments are **client-controlled**. The POST behind a form can be replayed with any payload, so a `readOnly` input, a disabled select, or a value handed down through props is a UI affordance — never a constraint.

- **Never trust an identity-bearing argument.** Re-resolve it server-side from something the caller cannot choose. This was a real bug: `acceptInviteAndSetPassword` took `email` from the form, so anyone holding an invite link could register under **any** address and collect the invited role — while the admin's list showed they had invited someone else. It now re-fetches the invite and uses _its_ email.
- Ask of every action argument: "if an attacker sets this to anything they like, what do they get?" If the answer is "someone else's access", it must not come from the client.
- Zod proves the **shape**, not the **right** to submit it. `z.string().email()` happily accepts `attacker@evil.com`.

### Authorization

- **The backend owns roles and permissions.** The frontend never reads or writes them directly.
- `services/authz.service.ts` fetches them from Tensor-Core when Better Auth mints an access token, and `lib/auth.ts` stamps them into the JWT. That runs about every 15 minutes per user, never per request.
- It **fails closed**: if the backend is unreachable, the token is minted with no roles, so every backend guard rejects. Never "helpfully" default to a role on error.
- **The frontend does not enforce authorization.** Hiding a button is UX, not security. Every real check happens in Tensor-Core against the verified token.

---

## Naming conventions

| Thing            | Convention                        | Example                          |
| ---------------- | --------------------------------- | -------------------------------- |
| React components | PascalCase                        | `UserCard.tsx`                   |
| Hooks            | camelCase, `use` prefix           | `useUserData.ts`                 |
| Utils/helpers    | camelCase                         | `formatDate.ts`                  |
| Types/interfaces | PascalCase                        | `UserCardProps`, `ApiResponse`   |
| Zustand stores   | camelCase, `use` prefix + `Store` | `useAuthStore.ts`                |
| Server actions   | camelCase, verb first             | `createUser.ts`, `deletePost.ts` |
| Constants        | SCREAMING_SNAKE_CASE              | `MAX_FILE_SIZE`                  |

---

## State management rules

- Local UI state → `useState`
- Shared client state → Zustand (in `stores/`)
- Server state / async → TanStack Query
- Forms → React Hook Form + Zod resolver
- Never mix Zustand and React Query for the same data

---

## Validation rules

- **All external data must be validated with Zod** — API responses, form inputs, env vars, URL params
- Define Zod schemas in the same file as the type, or in `[feature]/types.ts`
- Infer TypeScript types from Zod schemas: `type User = z.infer<typeof UserSchema>`

---

## After every code change

1. Run `pnpm lint` and fix ALL errors before saying the task is done.
2. Run `pnpm type-check` (`tsc --noEmit`) and fix all type errors.
3. If you modified a component, check that its props interface is still accurate.
4. If you created a new file, confirm it's in the right folder per the structure above.

---

## Server vs client components

- **Default: server component.** No `"use client"` directive.
- Add `"use client"` only when the component uses: `useState`, `useEffect`, browser APIs, event handlers, or third-party client-only libs.
- Never fetch data in a client component — use server components or React Query.
- Keep `"use client"` components as leaf nodes — push them down the tree as far as possible.

---

## Typography — three fonts, one job each

The design language is "Editorial Ink" (tokens in `app/globals.css`). Its premium feel comes from restraint and hierarchy, not decoration. Respect the font split exactly:

| Font       | Token / class            | Used for                                                   | Never used for                                                  |
| ---------- | ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Mona Sans  | `.text-display`          | Page titles and display moments, roughly 28px and up       | Labels, table headers, buttons, body copy, anything under ~28px |
| Geist Sans | `font-sans` (default)    | The whole interface: labels, controls, body, table headers | Figures                                                         |
| Geist Mono | `font-mono tabular-nums` | Every figure (₹, g, h, %)                                  | Prose                                                           |

- **The display face is a signal, not a texture.** At most one `.text-display` per screen, at the top of the hierarchy. If you find yourself reaching for it a second time, the hierarchy is wrong.
- **Never set the display face below ~28px.** Mona Sans and Geist Sans are both grotesques, so at UI sizes the display face stops reading as a signal and just looks like heavy body text. Its distinction comes from weight (700) and the optical-size axis, which `font-optical-sizing: auto` drives from font-size — that only pays off at display sizes.
- **Mona Sans is self-hosted** from `app/fonts/MonaSans-VF.woff2` (one variable file, weight axis 200-900) via `next/font/local`. It is not on Google Fonts. Its OFL licence sits beside it and must stay there.
- **Never add an unlicensed font.** Helvetica Neue and friends need a paid Monotype webfont licence; a bare `.otf`/`.ttf` bundle with no EULA is not licensed for web embedding. Geist is the free, OFL, Helvetica-lineage grotesque already in the stack.
- **De-emphasis comes from size, weight and tracking — never from lowering contrast.** Every text token in the palette meets WCAG AA (4.5:1) on the worst surface it renders on, including `--subtle-foreground`. Do not introduce a lighter grey to make something look quieter.
- **Use `.text-display`, not `font-serif` plus ad-hoc tracking.** The leading and optical tracking are part of the treatment and ship with the utility.

---

## Data visualization — must be distinctive, never generic

Tensor is a costing/pricing tool: charts and metrics ARE the product. Every visualization must look considered and bespoke — never a default library chart dropped in as-is.

- **No off-the-shelf defaults.** Never ship a chart with library default colors, gridlines, tooltips, or legends. Always restyle to the Tensor design language (tokens in `app/globals.css`).
- **Use the design tokens, not raw hex.** Pull series/status colors from the theme (`--accent`, `--success`, `--warning`, `--danger`, ivory/ink neutrals). Saturated color carries meaning (status, thresholds) — never decoration. Must work in both light and dark.
- **Numbers are tabular mono.** All figures (₹, grams, hours, %) use the mono/tabular treatment (`font-mono tabular-nums`) so columns and axes align. Reuse `DataValue`/`Stat` where they fit.
- **Pick the right form for the question.** Match chart type to the decision being made (e.g. Design CP vs SP ladder, CP-%-of-SP thresholds, machine-time distributions, batch efficiency). Don't force everything into a bar chart. Show the threshold/target line when one exists (the ≤25% / ≤30% CP rules, the 2-hour machine-time target).
- **Craft the details.** Deliberate axes, spacing, and typographic hierarchy; direct labels over legends when possible; meaningful empty/loading/zero states; accessible contrast and non-color-only encoding (shape/label as well as hue).
- **Before writing ANY chart code, load the `dataviz` skill** and follow it. `recharts` is already a dependency — prefer it; ask before adding a new charting lib.
- **No AI-generic look.** No gradient fills for their own sake, no glassmorphism, no rainbow categorical palettes. Restrained, precise, instrument-grade — consistent with "Editorial Ink" (the design language defined in `app/globals.css`).

---

## What NOT to do (common AI mistakes to avoid)

- Don't create a new `utils.ts` at the root — check if `lib/` already has what you need
- Don't install new packages without asking — we have a curated dep list
- Don't create barrel files (`index.ts`) everywhere — only one per feature's public API
- Don't add `useEffect` for data that can be fetched server-side
- Don't create a new Context when Zustand already handles that state
- Don't write inline styles — use Tailwind classes
- Don't generate placeholder/TODO code and leave it — finish what you start
- Don't drop in a default library chart — restyle every visualization to the design language (see "Data visualization" above)
