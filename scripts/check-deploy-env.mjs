/**
 * Runs first in the deploy build. Stops with a clear message when a required
 * environment variable is missing, instead of failing later with a confusing
 * database or signing error.
 */
const required = {
  DATABASE_URL: 'PostgreSQL connection string of the database the site uses.',
  NEXTAUTH_SECRET: 'Long random string that signs login sessions (openssl rand -base64 48).',
};

const missing = Object.keys(required).filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error('\n✖ Missing environment variables for this deployment:\n');
  for (const name of missing) console.error(`  ${name} — ${required[name]}`);
  console.error(
    '\nAdd them in your hosting dashboard (Vercel: Project → Settings → Environment Variables)' +
      '\nfor the environment you are deploying (Production and/or Preview), then redeploy.\n'
  );
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn(
    '! NEXT_PUBLIC_APP_URL is not set; links in metadata and the sitemap will use the default domain.'
  );
}
