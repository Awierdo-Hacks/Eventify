import 'server-only';

/**
 * Server-side environment access. Values are read lazily so that `next build`
 * works without secrets, and fail loudly at first use when something required
 * is missing in production.
 */

const isProduction = process.env.NODE_ENV === 'production';

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProduction && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable ${name}`);
}

export const env = {
  get databaseUrl() {
    return required('DATABASE_URL');
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
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
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
