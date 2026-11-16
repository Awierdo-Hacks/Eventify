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

| v1 problem                                                                                                                                                                                                       | v2 answer                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every page is a client component: load JS → fetch session → fetch 3–4 APIs → render. That waterfall is the "slow dashboard".                                                                                     | Server Components read the session cookie and query the database directly, in parallel, and stream HTML. No session round-trip, no client waterfall. |
| 1,000+ line page files, each with its own copies of types, fetch logic and dialogs.                                                                                                                              | Feature folders (`queries.ts`, `actions.ts`, `schemas.ts`, components). Routes are thin.                                                             |
| One dashboard page with tabs that loads everything up front.                                                                                                                                                     | App shell with real routes per section; each loads only its own data.                                                                                |
| Chat keeps a server connection open per user and polls the DB inside it.                                                                                                                                         | Small incremental poll that pauses when the tab is hidden.                                                                                           |
| framer-motion on most pages, emoji as icons, gradients and 2px borders everywhere.                                                                                                                               | CSS-only motion, one icon set, restrained use of the brand gradient.                                                                                 |
| No input validation layer, `any` in most API routes.                                                                                                                                                             | zod schemas shared by forms and server actions, strict TypeScript.                                                                                   |
| Security gaps: committed `.env` with live credentials, `/api/debug-login`, hard-coded analysis key, unauthenticated upload that accepts SVG, unsigned OAuth state, banned users keep a valid session for 7 days. | See "Security" below.                                                                                                                                |
| No privacy tooling: no consent, no account deletion, no data export, terms not recorded.                                                                                                                         | See "Legal & privacy" below.                                                                                                                         |
| Uploads written to local disk (lost on every deploy on serverless hosts).                                                                                                                                        | Storage driver: local disk for dev/Docker, object storage in production.                                                                             |

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

- [x] Remove v1 app code from this branch (kept on `main`); keep prisma, public assets, legal source doc
- [x] Remove tracked `.env`; add `.env.example`; local Postgres for dev
- [x] New `package.json` (drop unused deps: next-auth, jsonwebtoken, framer-motion, ts-node, supabase)
- [x] TS strict config, ESLint flat config, Prettier
- [x] `lib/env` (validated env), `lib/db` (Prisma singleton), `lib/session`, `lib/auth` guards
- [x] Storage driver (local + object storage), upload validation by file signature
- [x] Rate limiter for auth / waitlist / upload endpoints
- [x] Security headers in `next.config.ts`

### Phase 1 — Design system

- [x] Tokens in `globals.css` (colour, type, radius, shadow, motion), self-hosted fonts
- [x] Primitives: Button, Input, Textarea, Select, Checkbox, Label, Field, Card, Badge,
      StatusBadge, Avatar, Alert, Dialog (bottom sheet on phones), ConfirmDialog,
      Dropdown, Toast, Skeleton, EmptyState, StatCard, Stars, Pagination, MonthCalendar
- [x] Logo component, category icon map, shared labels/formatters (nl-BE)

### Phase 2 — Public site

- [x] Site header + footer (with legal links and cookie settings)
- [x] Home (hero search, categories, how it works, featured providers, for-providers, FAQ, CTA)
- [x] "Voor dienstverleners" landing page
- [x] Browse (server-rendered filters via URL, pagination, ranking disclosure)
- [x] Provider profile (gallery, services, availability, reviews, contact/quote CTA, report link)
- [x] About, Waitlist
- [x] 404 / error / loading states

### Phase 3 — Auth & onboarding

- [x] Login (with status messages for suspended/banned)
- [x] Register: customer + provider flows, terms acceptance recorded per role
- [x] Provider onboarding: photos + services after account creation (authenticated uploads)
- [x] Logout, route protection in `proxy.ts`, role-based redirects
- [x] Stale sessions (suspended / blocked / deleted accounts) are cleared instead of looping

### Phase 4 — Customer area

- [x] App shell (sidebar / mobile tab bar, unread badge)
- [x] Overview (next event, open quotes, upcoming bookings)
- [x] Events: list, create (templates), detail (slots, linked quotes, costs, edit, cancel)
- [x] Requests list, quote request form (`/request-quote/[id]`) with availability
- [x] Quotes: accept / reject (with reason), link to event slot
- [x] Bookings list, leave a review after a completed booking

### Phase 5 — Provider area

- [x] Overview (new requests, pending quotes, next booking, stats)
- [x] Requests → create quote
- [x] Quotes (status, rejection feedback, withdraw rejected)
- [x] Bookings (status updates)
- [x] Agenda (block/unblock dates, booked + external days, stats)
- [x] Calendar sync: Google OAuth (signed state) + iCal URL (SSRF-safe)
- [x] Profile editor (details, services, images)

### Phase 6 — Messaging

- [x] Conversation list with unread counts
- [x] Thread: text, attachments (image/PDF), quote cards, send quote from chat
- [x] Accept / reject / link quote from chat
- [x] Incremental polling, visibility-aware; unread badge in shell

### Phase 7 — Admin

- [x] Overview (stats + recent activity)
- [x] Providers: verify, show/hide, delete, detail
- [x] Users: suspend, ban, activate, delete
- [x] Waitlist: list, breakdown, CSV export (replaces `/analyse`)
- [x] Content reports queue

### Phase 8 — Legal & privacy (EU / Belgium)

- [x] Cookie consent: accept / reject with equal prominence, per-category choice,
      withdraw any time, nothing non-essential loads before consent, consent proof stored
- [x] Cookie policy page (table of cookies actually used)
- [x] Privacy policy (controller, purposes + legal bases, processors, transfers,
      retention, rights, GBA complaint route)
- [x] Terms: general terms, customer terms, provider terms (incl. P2B: ranking,
      suspension reasons, complaint handling, notice of changes)
- [x] Versioned terms; acceptance stored; re-acceptance prompt when a version changes
- [x] Account page: edit profile, change password, download my data, delete account
- [x] Report content (DSA notice-and-action) + legal contact point
- [x] Review transparency note, ranking explanation, trader status on provider profiles
- [x] Company details placeholders in `config/site.ts` + "before launch" list in README

### Phase 9 — Quality

- [x] SEO: metadata, sitemap with real provider pages, robots, JSON-LD, OG image
- [x] Accessibility pass (keyboard, focus, contrast, labels, reduced motion)
- [x] Performance pass (bundle check, query review, DB indexes, image sizes)
- [x] Seed script updated; end-to-end smoke test of the main flows with a local DB
- [x] `npm run build`, typecheck and lint clean
- [x] README rewritten (setup, architecture, deploy, launch checklist)
- [x] Dockerfile and docker-compose updated for the new layout; `/api/health`

## Verification (last run)

- `npm run typecheck`, `npm run lint`, `npm run build`: clean.
- `tests/e2e-smoke.cjs` against the production build with a local database:
  **22 / 22** checks pass (registration with terms, event, request, quote,
  accept → booking, chat, quote from chat, agenda and availability, data export,
  deletion guard, access control, waitlist, report, cookie consent, admin).
- Migration applied cleanly to an empty database and to a simulation of the
  production drift (existing `waitlist_entries` / `btw_number`), keeping data.
- Automated WCAG 2.1 AA scan (axe-core) on 17 key pages: no violations. Automated
  scans catch only part of what matters; a manual keyboard and screen-reader pass
  is still worth doing before launch.
- Local production timings: pages 30–60 ms, in-app navigation 30–75 ms.

Not verified here (needs real credentials or infrastructure): Google Calendar
OAuth end to end, Vercel Blob uploads, the Docker image build, and behaviour
against the real production database.

## Decisions made by the owner

1. Database: additive-only migrations are allowed.
2. Brand spelling: **Eventiphy**.
3. Languages: Dutch only.
4. Analytics: none for now; the consent system is ready for when one is added.

## Owner actions (cannot be done from code)

See "Before launch" in the README for the full list. The essentials:

- [ ] **Rotate the database password and `NEXTAUTH_SECRET`** — both were committed
      in `.env` on `main` and remain in git history.
- [ ] Fill in legal entity details in `src/config/site.ts` (name, KBO/VAT number, address).
- [ ] Create the mailboxes named in the legal texts.
- [ ] Have the legal texts reviewed by a Belgian lawyer before launch.
- [ ] Sign data processing agreements with hosting, database and storage providers.
- [ ] Back up the database, then apply the v2 migration at deploy time.
- [ ] Decide on transactional e-mail (needed for the notices the terms promise).
