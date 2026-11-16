import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { env } from '@/lib/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = env.databaseUrl;
  const isLocal = /@(localhost|127\.0\.0\.1|postgres)[:/]/.test(connectionString);

  const adapter = new PrismaPg({
    connectionString,
    max: env.poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Managed Postgres hosts (Render, Neon, …) require TLS; their certificate
    // chains are not always in Node's trust store, hence the relaxed check
    // (same behaviour as v1).
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

/**
 * One Prisma client per server instance, created on first use. Creating it
 * lazily means importing this module never needs DATABASE_URL — so the
 * production build works on a machine that has no database access.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
