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
