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

/** One Prisma client per server instance (and per dev-server lifetime). */
export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
