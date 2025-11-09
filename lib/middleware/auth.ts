import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

/**
 * Middleware helper to require authentication
 * Returns session if authenticated, otherwise returns error response
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Middleware helper to require specific role(s)
 * Returns session if authorized, otherwise returns error response
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const { error, session } = await requireAuth();

  if (error) {
    return { error, session: null };
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session!.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Middleware helper to require provider role with valid providerId
 */
export async function requireProvider() {
  const { error, session } = await requireRole('PROVIDER');

  if (error) {
    return { error, session: null };
  }

  if (!session!.providerId) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden - no provider account linked' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Check if user can access a resource
 * - Admins can access everything
 * - Resource owner can access their own data
 * - Others are denied
 */
export function canAccessResource(
  session: { id: string; role: UserRole },
  resourceOwnerId: string
): boolean {
  return session.role === 'ADMIN' || session.id === resourceOwnerId;
}

/**
 * Check if provider can access a resource
 * - Admins can access everything
 * - Provider can access their own provider data
 * - Others are denied
 */
export function canAccessProviderResource(
  session: { providerId: string | null; role: UserRole },
  resourceProviderId: string
): boolean {
  return session.role === 'ADMIN' || session.providerId === resourceProviderId;
}
