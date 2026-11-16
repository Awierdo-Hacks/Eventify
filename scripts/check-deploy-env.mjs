/**
 * Runs before the build (npm "prebuild" hook). On a hosting platform it stops
 * with a clear message when a required environment variable is missing,
 * instead of producing a site that fails on its first request.
 *
 * It only enforces on a deploy platform (Vercel sets VERCEL=1) or when
 * CHECK_DEPLOY_ENV=1, so local and Docker builds are unaffected.
 */
const enforce = process.env.VERCEL === '1' || process.env.CHECK_DEPLOY_ENV === '1';

const required = {
  DATABASE_URL: 'PostgreSQL connection string of the database the site uses.',
  NEXTAUTH_SECRET: 'Long random string that signs login sessions (openssl rand -base64 48).',
};

const missing = Object.keys(required).filter((name) => !process.env[name]);

if (enforce && missing.length > 0) {
  console.error('\n✖ Missing environment variables for this deployment:\n');
  for (const name of missing) console.error(`  ${name} — ${required[name]}`);

  // A storage integration added with a custom prefix creates names such as
  // DATABASE_URL_POSTGRES_URL, which the app does not read.
  const lookalikes = Object.keys(process.env).filter((name) =>
    /^DATABASE_URL_.+|^POSTGRES_(PRISMA_)?URL$/.test(name)
  );
  if (missing.includes('DATABASE_URL') && lookalikes.length > 0) {
    console.error(
      `\n  Found similar variables: ${lookalikes.join(', ')}.` +
        '\n  The app only reads DATABASE_URL. If one of these is the database you want,' +
        '\n  add a variable named exactly DATABASE_URL with that value (use the direct' +
        '\n  "postgres://" URL, not the "prisma+postgres://" one).'
    );
  }

  console.error(
    '\nAdd them in your hosting dashboard (Vercel: Project → Settings → Environment Variables)' +
      '\nfor the environment you are deploying (Production and/or Preview), then redeploy.\n'
  );
  process.exit(1);
}

if (enforce && !process.env.NEXT_PUBLIC_APP_URL) {
  console.warn(
    '! NEXT_PUBLIC_APP_URL is not set; links in metadata and the sitemap will use the default domain.'
  );
}
