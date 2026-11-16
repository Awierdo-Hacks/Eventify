import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { resolveDatabaseUrl } from './scripts/database-url.mjs';

/**
 * `prisma generate` runs on every `npm install` and does not talk to the
 * database, so it must work when no connection string is available (for
 * example while a host is installing dependencies). Commands that do connect —
 * migrate, seed, studio — use the real URL; without one they fail on the
 * placeholder below instead of touching anything.
 */
const PLACEHOLDER_URL = 'postgresql://missing:missing@database-url-not-set.invalid:5432/missing';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: resolveDatabaseUrl()?.url ?? PLACEHOLDER_URL,
  },
});
