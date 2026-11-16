/**
 * Runs before the build (npm "prebuild" hook). On a hosting platform it stops
 * with a clear message when something required is missing, instead of
 * producing a site that fails on its first request.
 *
 * It only enforces on a deploy platform (Vercel sets VERCEL=1) or when
 * CHECK_DEPLOY_ENV=1, so local and Docker builds are unaffected.
 */
import { DATABASE_URL_VARIABLES, resolveDatabaseUrl } from './database-url.mjs';

const enforce = process.env.VERCEL === '1' || process.env.CHECK_DEPLOY_ENV === '1';
if (!enforce) process.exit(0);

const problems = [];

const database = resolveDatabaseUrl();
if (database) {
  console.log(`Database connection: using ${database.variable}`);
} else {
  const accelerateOnly = Object.entries(process.env).some(
    ([name, value]) => /DATABASE_URL|POSTGRES/.test(name) && value?.startsWith('prisma+postgres://')
  );
  problems.push(
    `No database connection string. Set DATABASE_URL, or connect a Postgres store to the project\n` +
      `    (looked for: ${DATABASE_URL_VARIABLES.join(', ')}).` +
      (accelerateOnly
        ? '\n    Only a "prisma+postgres://" URL was found; the app needs the direct "postgres://" URL.'
        : '')
  );
}

if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  problems.push(
    'NEXTAUTH_SECRET is missing: a long random string that signs login sessions (openssl rand -base64 48).'
  );
}

if (problems.length > 0) {
  console.error('\n✖ This deployment is missing configuration:\n');
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error(
    '\nFix this in your hosting dashboard (Vercel: Project → Settings → Environment Variables),' +
      '\nfor the environment you are deploying (Production and/or Preview), then redeploy.\n'
  );
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn(
    '! NEXT_PUBLIC_APP_URL is not set; links in metadata and the sitemap will use the default domain.'
  );
}
