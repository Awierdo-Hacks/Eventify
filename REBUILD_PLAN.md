# Eventiphy 2.0 — rebuild plan & checklist

Branch: `claude/brave-meitner-lhr5y8` (v1 stays untouched on `main`).

This file is the single source of truth for the rebuild. Tick items as they are
finished; if a session is interrupted, resume at the first unticked item.

## Ground rules

- **Same database.** The Prisma schema and all existing migrations are kept. New
  migrations are additive only (new nullable columns / new tables / indexes), so
  v1 on `main` keeps working against the same database.
- **Never run anything against the production database from a dev session.**
  Local development uses a local Postgres. Migrations are applied to production
  only by the owner at deploy time (`prisma migrate deploy`).
- **Same functionality.** Customers, providers, admin, events with slots,
  requests, quotes, bookings, reviews, messaging, agenda + calendar sync, waitlist.
- **Same brand colours** (purple → amber), new design language.
- **Public URLs stay stable** (`/`, `/browse`, `/providers/[id]`, `/about`,
  `/waitlist`, `/voorwaarden`, `/login`, `/register`, `/dashboard`,
  `/provider-dashboard`, `/admin`, `/messages`).

## What v1 taught us (the problems v2 fixes)

| v1 problem | v2 answer |
|---|---|
| Every page is a client component: load JS → fetch session → fetch 3–4 APIs → render. That waterfall is the "slow dashboard". | Server Components read the session cookie and query the database directly, in parallel, and stream HTML. No session round-trip, no client waterfall. |
| 1,000+ line page files, each with its own copies of types, fetch logic and dialogs. | Feature folders (`queries.ts`, `actions.ts`, `schemas.ts`, components). Routes are thin. |
| One dashboard page with tabs that loads everything up front. | App shell with real routes per section; each loads only its own data. |
| Chat keeps a server connection open per user and polls the DB inside it. | Small incremental poll that pauses when the tab is hidden. |
| framer-motion on most pages, emoji as icons, gradients and 2px borders everywhere. | CSS-only motion, one icon set, restrained use of the brand gradient. |
| No input validation layer, `any` in most API routes. | zod schemas shared by forms and server actions, strict TypeScript. |
| Security gaps: committed `.env` with live credentials, `/api/debug-login`, hard-coded analysis key, unauthenticated upload that accepts SVG, unsigned OAuth state, banned users keep a valid session for 7 days. | See "Security" below. |
| No privacy tooling: no consent, no account deletion, no data export, terms not recorded. | See "Legal & privacy" below. |
| Uploads written to local disk (lost on every deploy on serverless hosts). | Storage driver: local disk for dev/Docker, object storage in production. |

## Architecture

- Next.js 16 (App Router, React 19, Turbopack), TypeScript strict, Tailwind CSS v4
  (CSS-first tokens), Prisma 7 + `pg` adapter, zod, Radix primitives, lucide icons.
- Session: signed JWT in an httpOnly cookie (same cookie + secret as v1, so
  existing logins survive). User status is re-checked per request.
- Mutations: Server Actions returning a typed result; `revalidatePath`/tags after writes.
- Layout:

```
src/
  app/                 routes (thin): (marketing) (auth) (app) api
  components/ui/       design-system primitives
  components/layout/   site header/footer, app shell
  features/<domain>/   queries.ts · actions.ts · schemas.ts · components/
  lib/                 db, session, env, storage, rate-limit, format, constants
  config/site.ts       brand + company details (single place to edit)
prisma/                schema + migrations (shared with v1)
```

## Design direction

- Keep: purple `#9333ea` → amber `#f59e0b` identity, light and friendly tone, Dutch copy.
- Change: warm neutral surfaces, deep aubergine ink for text and dark sections,
  hairline borders, 12–16px radii, layered soft shadows, gradient only for the
  logo, primary emphasis and key headline words.
- Type: Plus Jakarta Sans (UI + headings) with Instrument Serif italic as the
  accent in marketing headlines. Self-hosted (no third-party font requests).
- Icons: lucide line icons in tinted tiles replace emoji.
- App: sidebar on desktop, bottom tab bar on mobile, one route per section.
- Component base: shadcn/ui conventions (Radix + Tailwind), written in-repo.

## Checklist

### Phase 0 — Foundation
- [ ] Remove v1 app code from this branch (kept on `main`); keep prisma, public assets, legal source doc
- [ ] Remove tracked `.env`; add `.env.example`; local Postgres for dev
- [ ] New `package.json` (drop unused deps: next-auth, jsonwebtoken, framer-motion, ts-node, supabase)
- [ ] TS strict config, ESLint flat config, Prettier
- [ ] `lib/env` (validated env), `lib/db` (Prisma singleton), `lib/session`, `lib/auth` guards
- [ ] Storage driver (local + object storage), upload validation by file signature
- [ ] Rate limiter for auth / waitlist / upload endpoints
- [ ] Security headers in `next.config.ts`

### Phase 1 — Design system
- [ ] Tokens in `globals.css` (colour, type, radius, shadow, motion), self-hosted fonts
- [ ] Primitives: Button, Input, Textarea, Select, Checkbox, Label, Field, Card, Badge,
      Avatar, Dialog, Sheet, Dropdown, Tabs, Tooltip, Toast, Skeleton, EmptyState,
      StatusBadge, Stars, Pagination, Calendar
- [ ] Logo component, category icon map, shared labels/formatters (nl-BE)

### Phase 2 — Public site
- [ ] Site header + footer (with legal links and cookie settings)
- [ ] Home (hero search, categories, how it works, featured providers, for-providers, CTA)
- [ ] Browse (server-rendered filters via URL, pagination, ranking disclosure)
- [ ] Provider profile (gallery, services, availability, reviews, contact/quote CTA, report link)
- [ ] About, Waitlist
- [ ] 404 / error / loading states

### Phase 3 — Auth & onboarding
- [ ] Login (with status messages for suspended/banned)
- [ ] Register: customer + provider flows, terms acceptance recorded per role
- [ ] Provider onboarding: photos + services after account creation (authenticated uploads)
- [ ] Logout, route protection in `proxy.ts`, role-based redirects

### Phase 4 — Customer area
- [ ] App shell (sidebar / mobile tab bar, unread badge)
- [ ] Overview (next event, open quotes, upcoming bookings)
- [ ] Events: list, create (templates), detail (slots, linked quotes, costs, edit, cancel)
- [ ] Requests list, quote request form (`/request-quote/[id]`) with availability
- [ ] Quotes: accept / reject (with reason), link to event slot
- [ ] Bookings list, leave a review after a completed booking

### Phase 5 — Provider area
- [ ] Overview (new requests, pending quotes, next booking, stats)
- [ ] Requests → create quote
- [ ] Quotes (status, rejection feedback, withdraw rejected)
- [ ] Bookings (status updates)
- [ ] Agenda (block/unblock dates, booked + external days, stats)
- [ ] Calendar sync: Google OAuth (signed state) + iCal URL (SSRF-safe)
- [ ] Profile editor (details, services, images)

### Phase 6 — Messaging
- [ ] Conversation list with unread counts
- [ ] Thread: text, attachments (image/PDF), quote cards, send quote from chat
- [ ] Accept / reject / link quote from chat
- [ ] Incremental polling, visibility-aware; unread badge in shell

### Phase 7 — Admin
- [ ] Overview (stats + recent activity)
- [ ] Providers: verify, show/hide, delete, detail
- [ ] Users: suspend, ban, activate, delete
- [ ] Waitlist: list, breakdown, CSV export (replaces `/analyse`)
- [ ] Content reports queue

### Phase 8 — Legal & privacy (EU / Belgium)
- [ ] Cookie consent: accept / reject with equal prominence, per-category choice,
      withdraw any time, nothing non-essential loads before consent, consent proof stored
- [ ] Cookie policy page (table of cookies actually used)
- [ ] Privacy policy (controller, purposes + legal bases, processors, transfers,
      retention, rights, GBA complaint route)
- [ ] Terms: general terms, customer terms, provider terms (incl. P2B: ranking,
      suspension reasons, complaint handling, notice of changes)
- [ ] Versioned terms; acceptance stored; re-acceptance prompt when a version changes
- [ ] Account page: edit profile, change password, download my data, delete account
- [ ] Report content (DSA notice-and-action) + legal contact point
- [ ] Review transparency note, ranking explanation, trader status on provider profiles
- [ ] Company details placeholders in `config/site.ts` + "before launch" list in README

### Phase 9 — Quality
- [ ] SEO: metadata, sitemap with real provider pages, robots, JSON-LD, OG image
- [ ] Accessibility pass (keyboard, focus, contrast, labels, reduced motion)
- [ ] Performance pass (bundle check, query review, DB indexes, image sizes)
- [ ] Seed script updated; end-to-end smoke test of the main flows with a local DB
- [ ] `npm run build`, typecheck and lint clean
- [ ] README rewritten (setup, architecture, deploy, launch checklist)

## Open decisions (asked of the owner)

1. Additive database migrations — allowed?
2. Brand spelling — Eventiphy (code, domain) or Eventify?
3. Languages — Dutch only, or more from the start?
4. Analytics — none yet, cookieless, or Google Analytics?

## Owner actions (cannot be done from code)

- [ ] **Rotate the database password and `NEXTAUTH_SECRET`** — both were committed
      in `.env` on `main` and remain in git history.
- [ ] Fill in legal entity details (name, KBO/VAT number, registered address, contact e-mail).
- [ ] Have the legal texts reviewed by a Belgian lawyer before launch.
- [ ] Sign data processing agreements with hosting, database and storage providers.
