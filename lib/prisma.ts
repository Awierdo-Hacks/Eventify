import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = getDatabaseUrl();
  const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

  // Add connection pool settings to URL
  const pooledConnectionString = connectionString.includes('?')
    ? `${connectionString}&connection_limit=10&pool_timeout=10`
    : `${connectionString}?connection_limit=10&pool_timeout=10`;

  // Optional cap on connections per instance (useful on serverless, or for single-connection local dev DBs)
  const poolMax = Number(process.env.DATABASE_POOL_MAX) || undefined;

  const adapter = new PrismaPg({
    connectionString: pooledConnectionString,
    ...(poolMax && { max: poolMax }),
    // Remote databases (Render, etc.) need SSL with relaxed cert validation
    ...(isRemote && { ssl: { rejectUnauthorized: false } }),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
