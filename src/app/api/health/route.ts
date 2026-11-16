import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Reason = 'DATABASE_URL_NOT_SET' | 'DATABASE_UNREACHABLE' | 'MIGRATIONS_NOT_APPLIED';

const HINTS: Record<Reason, string> = {
  DATABASE_URL_NOT_SET:
    'Set the DATABASE_URL environment variable (exactly that name) and redeploy.',
  DATABASE_UNREACHABLE: 'DATABASE_URL is set but the database did not accept the connection.',
  MIGRATIONS_NOT_APPLIED:
    'The database is reachable but misses the latest tables. Run "prisma migrate deploy".',
};

const unavailable = (reason: Reason) =>
  NextResponse.json(
    { status: 'unavailable', reason, hint: HINTS[reason] },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );

/**
 * Liveness and database check. On failure it says which of three things is
 * wrong, so a broken deployment can be diagnosed from the browser. It never
 * returns connection details or error text.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) return unavailable('DATABASE_URL_NOT_SET');

  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('[health] database unreachable', error);
    return unavailable('DATABASE_UNREACHABLE');
  }

  try {
    // Added by the v2 migration; missing means migrations have not run here.
    await db.$queryRaw`SELECT 1 FROM legal_acceptances LIMIT 1`;
    await db.$queryRaw`SELECT deleted_at FROM users LIMIT 1`;
  } catch (error) {
    console.error('[health] schema check failed', error);
    return unavailable('MIGRATIONS_NOT_APPLIED');
  }

  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
