# Eventiphy 2.0

A marketplace that connects people who are planning an event with the providers
who make it happen: venues, catering, DJs, photographers and more. Customers plan
an event, request and compare quotes, and confirm bookings; providers manage
requests, quotes, bookings and their agenda.

This branch is a ground-up rebuild of v1 (which stays on `main`). It uses the
**same database** and offers the same functionality, with a new design, a new
code structure, and the privacy and legal groundwork for running as a company in
the EU.

- **Stack:** Next.js 16 (App Router, React 19), TypeScript (strict), Tailwind CSS v4,
  Prisma 7 on PostgreSQL, zod, Radix primitives.
- **Language of the product:** Dutch (Belgium).
- **Progress and checklist:** [`REBUILD_PLAN.md`](./REBUILD_PLAN.md).

---

## Getting started

Requirements: Node.js 20.19+ and PostgreSQL 16 (or Docker).

```bash
cp .env.example .env
```

```bash
docker compose up -d postgres
```

```bash
npm install
```

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000. Demo accounts (password `password123`):

| Role     | E-mail                               |
| -------- | ------------------------------------ |
| Admin    | `admin@eventiphy.nl`                 |
| Customer | `sarah.jansen@example.com`           |
| Provider | `info@culinairecreatiesamsterdam.nl` |

> **The seed wipes every table.** It refuses to run unless `DATABASE_URL` points
> at a local database. Never work against the production database from a
> development machine; use a local one.

### Scripts

| Command                       | What it does                                         |
| ----------------------------- | ---------------------------------------------------- |
| `npm run dev`                 | Development server                                   |
| `npm run build` / `npm start` | Production build and server                          |
| `npm run typecheck`           | TypeScript, no emit                                  |
| `npm run lint`                | ESLint                                               |
| `npm run db:deploy`           | Apply pending migrations                             |
| `npm run db:migrate`          | Create a migration during development                |
| `npm run db:seed`             | Load demo data (local databases only)                |
| `node tests/e2e-smoke.cjs`    | Browser test of the main flows (see the file header) |

---

## How the code is organised

```
src/
  app/                    Routes only. Pages are thin: read, render, done.
    (site)/               Public pages: home, browse, profiles, legal
    (auth)/               Login and registration
    (app)/                Signed-in areas: dashboard, provider-dashboard, admin,
                          messages, account, request-quote
    api/                  The few HTTP endpoints (polling, exports, OAuth, health)
  components/ui/          Design-system primitives (Button, Field, Dialog, …)
  components/layout/      Site header/footer and the signed-in app shell
  features/<domain>/      One folder per domain:
                            queries.ts   reading data (server only)
                            actions.ts   changing data (server actions)
                            schemas.ts   zod validation shared by form and server
                            components/  UI specific to the domain
  lib/                    db, session, env, storage, rate limit, formatting, catalog
  config/site.ts          Brand and company details — the one place to edit them
  proxy.ts                Fast route protection from the session cookie
prisma/                   Schema and migrations (shared with v1)
tests/                    End-to-end smoke test
```

Rules of thumb that keep it maintainable:

- **Data is read on the server.** Pages call `queries.ts` functions directly and
  in parallel; there are no client-side fetch waterfalls. Client components exist
  only where something is interactive.
- **Every change goes through a server action** that (1) checks who is asking,
  (2) validates input with zod, (3) does the work, in a transaction where several
  rows must agree, and (4) returns the same `ActionResult` shape. Forms use the
  `useAction` hook for pending state, field errors and toasts.
- **Authorisation is checked where the data is touched**, never only in the UI.
  `requireUser()` / `requireRole()` guard pages; actions re-check ownership.
- **Vocabulary lives in one file** (`lib/catalog.ts`): categories, statuses,
  labels. v1 stored provider categories in several spellings; `findCategory()`
  resolves all of them.

### Why it is fast

| v1                                                                               | v2                                                                                |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Page loads JS, then asks for the session, then fires 3–4 API calls, then renders | The server reads the cookie, runs the queries in parallel and sends finished HTML |
| One dashboard page loads every tab's data                                        | One route per section; each loads only its own data                               |
| Chat holds a server connection open per user and polls the database inside it    | A small request every few seconds, only while the tab is visible                  |
| Animation library on most pages                                                  | CSS only                                                                          |
| Fonts and images unoptimised                                                     | Self-hosted fonts, responsive images                                              |

Public data (search results, profiles, category counts) is cached on the server
and refreshed the moment a profile changes. Measured locally on a production
build: pages answer in 30–60 ms and moving between dashboard sections takes
30–75 ms. Real-world numbers depend mostly on the distance between the app and
the database — **host them in the same region.**

---

## Database

The Prisma schema and all v1 migrations are unchanged. v2 adds one migration,
`v2_privacy_and_indexes`, which is **additive and idempotent**:

- `users.deleted_at` — marks an erased account
- `legal_acceptances` — who accepted which version of which document, and when
- `consent_records` — proof of cookie choices (no IP address)
- `content_reports` — the queue behind "Inhoud melden"
- a handful of indexes

It also repairs drift: v1 created `waitlist_entries` and
`service_providers.btw_number` outside the migration history. The migration
creates them only if they are missing, so it applies cleanly both to the existing
production database and to an empty one (both cases were tested). v1 keeps
working against the migrated database.

Apply it at deploy time with `npm run db:deploy`. **Take a backup first.**

---

## Security

- **Sessions:** signed, httpOnly cookie (same format and secret as v1, so existing
  logins survive). The account is re-read on every request, so suspending or
  deleting an account takes effect immediately rather than when the cookie expires.
- **Passwords:** bcrypt; login responses do not reveal whether an address exists.
- **Rate limits** on login, registration, uploads, messages and public forms.
  The limiter is in-memory per server instance — good against casual abuse; put
  a shared store (e.g. Redis) behind `lib/rate-limit.ts` for hard guarantees on a
  multi-instance deployment.
- **Uploads** require a session; the file type is determined from the file's
  content, not its name. SVG is not accepted. Uploaded files are served with a
  policy that forbids script execution.
- **Calendar sync:** the Google OAuth state is signed and bound to the signed-in
  provider; iCal links are fetched through a client that refuses private network
  addresses; tokens are encrypted at rest; only free/busy information is read.
- **Headers:** Content-Security-Policy, HSTS, no framing, strict referrer policy.
- Removed from v1: the `/api/debug-login` endpoint, the hard-coded analysis key,
  the anonymous upload endpoint, the committed `.env`.

---

## Privacy and legal (EU / Belgium)

What the product does:

- **Cookies.** Only two cookies are set without consent, both strictly necessary
  (`session`, `ev_consent`). The banner offers refuse and accept with equal
  prominence on the first layer, per-category choice, and withdrawal at any time
  from the footer. Choices expire after six months and are logged as proof.
  Nothing non-essential loads before consent. Fonts are self-hosted, so no
  visitor data goes to third parties.
- **Analytics** are off. To add Google Analytics, set
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`; it then loads only after a visitor allows
  "Statistieken". For another tool, add it in `features/consent/analytics.tsx`
  and list its cookies on `/cookies`.
- **Terms.** Separate terms for customers and for providers, accepted with an
  unticked checkbox at registration and stored with their version. When a
  document's version changes (`features/legal/documents.ts`), signed-in users are
  asked to accept again. Accounts created in v1 are asked on their first v2 login.
- **Data-subject rights.** Under _Account & privacy_ users can correct their
  details, download everything held about them (JSON) and delete their account.
  Deletion erases personal data and keeps bookings, quotes and reviews in
  anonymous form for the other party; it is refused while bookings are upcoming.
- **Platform rules.** Search ranking is explained on the browse page and in the
  terms (ratings, never payment). Reviews can only be left after a completed
  booking, and the site says so. Provider profiles state that the provider acts
  as a trader. Anyone can report content at `/melden`; reports land in the admin
  queue, where the decision and its reasons are recorded.

### Before launch — things only the company can do

These are not code tasks and are **not done**:

1. **Rotate the database password and `NEXTAUTH_SECRET`.** Both were committed in
   `.env` on `main` and are in the git history. Treat them as compromised.
   Consider removing the file from history as well.
2. **Fill in the company details** in `src/config/site.ts`: legal name and form,
   KBO and VAT numbers, registered address. Belgian law requires them on the
   site; the legal pages and the footer read them from there.
3. **Create the mailboxes** used in the texts: `info@`, `privacy@`, `legal@`,
   `support@eventiphy.be` (or change them in `site.ts`).
4. **Have a Belgian lawyer review the legal texts** (`/privacy`, `/cookies`,
   `/voorwaarden/klanten`, `/voorwaarden/dienstverleners`). They were written
   carefully against the GDPR, the Belgian Code of Economic Law, the P2B
   Regulation and the Digital Services Act, but they are a starting point, not
   legal advice. Check in particular the liability clauses and whether the
   withdrawal-right exemption fits every category you list.
5. **Sign data-processing agreements** with your hosting, database and file
   storage providers, and check where they store data. The privacy statement
   says transfers outside the EEA rely on an adequacy decision or standard
   contractual clauses — make that true.
6. **Keep a record of processing activities** (GDPR art. 30) and decide who
   handles privacy requests and reported content, and within what time.
7. **Processes the texts promise but the software does not automate:**
   - notifying users by e-mail 15 days (30 for fees) before terms change — there
     is no e-mail sending yet;
   - telling a user why their account was restricted, and telling a reporter the
     outcome of a report — the admin screens remind you, the e-mail is manual;
   - deleting waitlist entries after two years and consent/acceptance proof after
     five years — no scheduled clean-up exists yet;
   - confirming your host keeps access logs no longer than 30 days.
8. **Google Calendar:** the app now requests the narrower free/busy permission.
   Update the OAuth consent screen in Google Cloud accordingly.

---

## Deployment

Environment variables are documented in [`.env.example`](./.env.example). At
minimum set `DATABASE_URL`, `NEXTAUTH_SECRET` and `NEXT_PUBLIC_APP_URL`.

**File uploads.** Without configuration, uploads are written to `public/uploads`
on the server's disk. That is fine for a host with a persistent disk (mount a
volume there), but **not for serverless hosts**, where the disk is temporary.
There, set `BLOB_READ_WRITE_TOKEN` and uploads go to Vercel Blob automatically.
Files already uploaded by v1 (`/uploads/...`) must exist on the new host too.

**Vercel:**

1. Set the environment variables under _Project → Settings → Environment
   Variables_, for **Production and Preview** (v1 read them from a committed
   `.env`; v2 does not): `DATABASE_URL`, `NEXTAUTH_SECRET`,
   `NEXT_PUBLIC_APP_URL`, and `BLOB_READ_WRITE_TOKEN` for uploads.
2. Deploy. Before building, the deploy checks those variables (and stops with a
   clear message if one is missing) and **applies pending migrations to the
   database in `DATABASE_URL`**. That includes preview deployments, so back up
   the database before the first v2 deploy.

   The variable must be named exactly `DATABASE_URL`. A storage integration
   added with a prefix creates names like `DATABASE_URL_POSTGRES_URL`, which
   the app does not read.

3. Functions run in Frankfurt (`vercel.json` → `fra1`), next to the database.
   If the database moves, change the region to match: every query from a
   far-away region costs a round trip across the distance.

**Is a deployment healthy?** Open `/api/health`. It answers `ok`, or says which
of three things is wrong: `DATABASE_URL_NOT_SET`, `DATABASE_UNREACHABLE` or
`MIGRATIONS_NOT_APPLIED`.

**Docker:** `docker build -t eventiphy .` produces a standalone server on port
3000 with a health check at `/api/health`. Run migrations from the same image
(`npx prisma migrate deploy`) before starting a new version.

**Going back to v1:** deploy `main`. The v2 migration only adds things, so v1
runs against the migrated database unchanged.

---

## Not included (deliberately)

The rebuild keeps v1's scope. These came up along the way and are natural next
steps: transactional e-mail (confirmations, password reset, the notifications
listed above), online payments, e-mail verification at sign-up, more languages,
dark mode, and automated tests beyond the smoke test.
