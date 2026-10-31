# Eventiphy deployment (Vercel)

Eventiphy runs **only on Vercel**, with Prisma Postgres as the database. Render and Docker are no longer used.

## Services

| What | Where | Env vars |
|---|---|---|
| Hosting, preview deploys | Vercel project (Git integration, `main` = production) | — |
| Database | Prisma Postgres (Vercel Marketplace) | `DATABASE_URL` (or `DATABASE_URL_POSTGRES_URL`) |
| Uploads | Vercel Blob | `BLOB_READ_WRITE_TOKEN` |
| Rate limiting | Upstash Redis (Vercel Marketplace) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Scheduled jobs | Vercel Cron (`vercel.json`) | `CRON_SECRET` |
| Payments | Mollie (switched off until the company is verified) | `NEXT_PUBLIC_PAYMENTS_MODE`, `MOLLIE_API_KEY` |

The full list with explanations is in [`.env.example`](../.env.example).

## Build

Vercel runs `npm run vercel-build`, which generates the Prisma client and builds Next.js.

**Migrations are not run automatically.** Before (or right after) deploying a commit that adds a migration under `prisma/migrations`, run against the production database:

```bash
# with the production DATABASE_URL in your shell
npm run db:migrate:deploy
```

## Environments

- **Production:** `eventiphy.be`. `NEXT_PUBLIC_PAYMENTS_MODE=off`, `NEXT_PUBLIC_DEMO_MODE=false`.
- **Preview:** every branch and PR gets a preview URL. Use a separate database (or branch) so previews never write to production data.
- **Demo (planned):** `demo.eventiphy.be` as a separate Vercel project with its own database, `NEXT_PUBLIC_DEMO_MODE=true`, `NEXT_PUBLIC_PAYMENTS_MODE=test`.

## Secrets

- Never commit `.env` files; `.env` and `.env.*` are git-ignored.
- After a leak: rotate `NEXTAUTH_SECRET` (logs everyone out) and the database password, then update the Vercel env vars and redeploy.

## Checks after a deploy

- `GET /api/health` returns `{"status":"healthy"}`.
- Log in as customer and provider, open both dashboards.
- Upload a profile photo (it should land in Vercel Blob).
