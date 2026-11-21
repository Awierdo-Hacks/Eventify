import 'server-only';
import {
  DATABASE_URL_VARIABLES,
  resolveDatabaseUrl,
  toDriverConnectionString,
} from '../../scripts/database-url.mjs';

/**
 * Server-side environment access. Values are read lazily so that `next build`
 * works without secrets, and fail loudly at first use when something required
 * is missing in production.
 */

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  get databaseUrl() {
    const resolved = resolveDatabaseUrl();
    if (!resolved) {
      throw new Error(
        `No database connection string found. Set one of: ${DATABASE_URL_VARIABLES.join(', ')}`
      );
    }
    return toDriverConnectionString(resolved.url);
  },
  /** True when a database connection string is configured. */
  get hasDatabaseUrl() {
    return resolveDatabaseUrl() !== null;
  },
  get sessionSecret() {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    if (secret) return secret;
    if (!isProduction) return 'development-secret';
    throw new Error('Missing required environment variable NEXTAUTH_SECRET');
  },
  get appUrl() {
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000'
    ).replace(/\/$/, '');
  },
  get poolMax() {
    const parsed = Number(process.env.DATABASE_POOL_MAX);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    // Serverless hosts run many small instances; keep each one's share low so
    // together they stay under the database's connection limit.
    return process.env.VERCEL ? 3 : 5;
  },
  get calendarEncryptionKey() {
    return process.env.CALENDAR_ENCRYPTION_KEY || null;
  },
  google: {
    get clientId() {
      return process.env.GOOGLE_CLIENT_ID || null;
    },
    get clientSecret() {
      return process.env.GOOGLE_CLIENT_SECRET || null;
    },
    get redirectUri() {
      return process.env.GOOGLE_REDIRECT_URI || null;
    },
  },
  get blobToken() {
    return process.env.BLOB_READ_WRITE_TOKEN || null;
  },
  isProduction,
};
