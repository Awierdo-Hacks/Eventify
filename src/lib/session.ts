import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  dashboardPathFor,
  signSessionToken,
  verifySessionToken,
  type Role,
  type SessionPayload,
} from '@/lib/session-token';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  providerId: string | null;
}

/**
 * The signed-in user for this request, or null.
 *
 * The cookie is verified and the account is then re-read from the database, so
 * a suspended, banned or deleted account loses access immediately instead of
 * when its token expires. `cache()` makes this one query per request no matter
 * how many components ask.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const payload = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      deleted_at: true,
      provider: { select: { id: true } },
    },
  });

  if (!user || user.status !== 'ACTIVE' || user.deleted_at) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    providerId: user.provider?.id ?? null,
  };
});

/** Require a signed-in user; otherwise send them to the login page. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : '/login');
  }
  return user;
}

/** Require a role; users with another role go to their own dashboard. */
export async function requireRole(role: Role, returnTo?: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (user.role !== role) redirect(dashboardPathFor(user.role));
  return user;
}

export async function requireCustomer(returnTo?: string) {
  return requireRole('CUSTOMER', returnTo);
}

export async function requireAdmin() {
  return requireRole('ADMIN', '/admin');
}

export type CurrentProvider = CurrentUser & { providerId: string };

export async function requireProvider(returnTo?: string): Promise<CurrentProvider> {
  const user = await requireRole('PROVIDER', returnTo);
  if (!user.providerId) redirect('/');
  return user as CurrentProvider;
}

export async function createSession(user: SessionPayload): Promise<void> {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
