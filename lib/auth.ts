import { cache } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole, UserStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

let secretKeyCache: Uint8Array | null = null;
let devSecretWarningShown = false;

function getSecretKey(): Uint8Array {
  if (secretKeyCache) {
    return secretKeyCache;
  }

  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET environment variable is not set');
    }

    if (!devSecretWarningShown) {
      console.warn('NEXTAUTH_SECRET is not set. Using a fallback development secret.');
      devSecretWarningShown = true;
    }

    secretKeyCache = new TextEncoder().encode('development-secret');
    return secretKeyCache;
  }

  secretKeyCache = new TextEncoder().encode(secret);
  return secretKeyCache;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  providerId: string | null;
}

export async function createToken(user: SessionUser): Promise<string> {
  const secretKey = getSecretKey();
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload.user as SessionUser;
  } catch (error) {
    return null;
  }
}

/**
 * Returns the logged-in user, re-checked against the database so that
 * suspended/banned users and role changes take effect immediately instead of
 * when the 7-day token expires. Deduplicated per request via React cache().
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  const tokenUser = await verifyToken(token);
  if (!tokenUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: { status: true, role: true, provider: { select: { id: true } } },
  });

  if (!user || user.status !== 'ACTIVE') return null;

  return {
    ...tokenUser,
    role: user.role,
    status: user.status,
    providerId: user.provider?.id ?? null,
  };
});

export async function setSession(user: SessionUser) {
  const token = await createToken(user);
  const cookieStore = await cookies();
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
