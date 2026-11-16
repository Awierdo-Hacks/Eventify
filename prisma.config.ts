import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * `prisma generate` runs on every `npm install` and does not talk to the
 * database, so it must work without DATABASE_URL (for example while a host is
 * installing dependencies). Commands that do connect — migrate, seed, studio —
 * get the real URL from the environment; without it they fail on the
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
    url: process.env.DATABASE_URL || PLACEHOLDER_URL,
  },
});
