# Eventiphy local development

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # fill in at least DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev      # apply migrations to your local/dev database
npx prisma db seed          # optional: test data
npm run dev                 # http://localhost:3000
```

- Without `BLOB_READ_WRITE_TOKEN`, uploads are written to `public/uploads` (local only).
- Without Upstash, rate limiting falls back to in-memory (local only).
- Set `NEXT_PUBLIC_DEMO_MODE=true` locally to get one-click demo logins for the seed accounts.

Useful checks before pushing:

```bash
npx tsc --noEmit
npm run build
```

Deployment: see [DEPLOYMENT.md](./DEPLOYMENT.md).
