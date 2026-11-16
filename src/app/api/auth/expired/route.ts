import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session-token';
import { safeRedirectPath } from '@/lib/utils';

/**
 * Clears a session cookie whose account is no longer valid (suspended,
 * blocked or deleted) and sends the visitor to the login page. Pages cannot
 * delete cookies while rendering, so they redirect here instead.
 */
export function GET(request: NextRequest) {
  const target = new URL('/login', request.url);
  target.searchParams.set('reden', 'sessie');
  const returnTo = safeRedirectPath(request.nextUrl.searchParams.get('redirect'), '');
  if (returnTo) target.searchParams.set('redirect', returnTo);

  const response = NextResponse.redirect(target);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
