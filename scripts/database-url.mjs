/**
 * Where the database connection string comes from. One implementation, used
 * by the app, by Prisma's own commands and by the deploy scripts.
 *
 * `DATABASE_URL` always wins. The other names are what Vercel's database
 * integrations create: a store connected with the prefix "DATABASE_URL" yields
 * DATABASE_URL_POSTGRES_URL and DATABASE_URL_DATABASE_URL, a store without a
 * prefix yields POSTGRES_URL. Reading those directly means the app keeps
 * working when the integration rotates the credentials.
 *
 * Only direct `postgres://` URLs are accepted; a `prisma+postgres://`
 * (Accelerate) URL cannot be used by the driver this app connects with.
 */
export const DATABASE_URL_VARIABLES = [
  'DATABASE_URL',
  'DATABASE_URL_POSTGRES_URL',
  'DATABASE_URL_DATABASE_URL',
  'POSTGRES_URL',
];

/**
 * @param {Record<string, string | undefined>} [source]
 * @returns {{ url: string, variable: string } | null}
 */
export function resolveDatabaseUrl(source = process.env) {
  for (const variable of DATABASE_URL_VARIABLES) {
    const value = source[variable]?.trim();
    if (value && /^postgres(ql)?:\/\//.test(value)) return { url: value, variable };
  }
  return null;
}

/**
 * The connection string as handed to the `pg` driver. Hosted Postgres URLs
 * (Vercel, Neon, Supabase) usually carry `sslmode=require`; `pg` already
 * treats require/prefer/verify-ca as `verify-full`, but warns on every build
 * that pg v9 will change that meaning. Spelling out `verify-full` keeps today's
 * behaviour (full certificate check), silences the warning and stays correct
 * after the upgrade. A URL that opts into libpq semantics is left untouched.
 *
 * Only for the driver: Prisma's own CLI (migrate) reads the URL unchanged.
 *
 * @param {string} url
 * @returns {string}
 */
export function toDriverConnectionString(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();
  if (parsed.searchParams.has('uselibpqcompat')) return url;
  if (sslMode !== 'prefer' && sslMode !== 'require' && sslMode !== 'verify-ca') return url;
  parsed.searchParams.set('sslmode', 'verify-full');
  return parsed.toString();
}
