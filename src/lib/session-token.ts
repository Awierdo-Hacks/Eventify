import { SignJWT, jwtVerify } from 'jose';

/**
 * Session token format. Kept identical to v1 (HS256 JWT, `{ user }` payload,
 * cookie name `session`) so existing logins keep working across both versions.
 *
 * This module has no Next.js or database imports so it can run in `proxy.ts`.
 */
export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  providerId: string | null;
}

function secretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET is not set');
    }
    return new TextEncoder().encode('development-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionPayload): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const user = payload.user as SessionPayload | undefined;
    if (!user || typeof user.id !== 'string' || typeof user.role !== 'string') return null;
    return user;
  } catch {
    return null;
  }
}

export function dashboardPathFor(role: Role): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'PROVIDER') return '/provider-dashboard';
  return '/dashboard';
}
