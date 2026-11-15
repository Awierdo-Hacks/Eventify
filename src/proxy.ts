import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, dashboardPathFor, verifySessionToken } from '@/lib/session-token';

/**
 * Fast, optimistic route protection: decides from the session cookie alone
 * (no database) whether to let a request through. Pages and actions still
 * perform the authoritative check with `requireUser()` / `requireRole()`.
 */
const ROLE_AREAS: Array<{ prefix: string; role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' }> = [
  { prefix: '/dashboard', role: 'CUSTOMER' },
  { prefix: '/request-quote', role: 'CUSTOMER' },
  { prefix: '/provider-dashboard', role: 'PROVIDER' },
  { prefix: '/admin', role: 'ADMIN' },
];
const SIGNED_IN_AREAS = ['/messages', '/account'];
const GUEST_ONLY = ['/login', '/register'];

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (GUEST_ONLY.some((prefix) => matches(pathname, prefix))) {
    if (session) return NextResponse.redirect(new URL(dashboardPathFor(session.role), request.url));
    return NextResponse.next();
  }

  const area = ROLE_AREAS.find(({ prefix }) => matches(pathname, prefix));
  const needsSession = Boolean(area) || SIGNED_IN_AREAS.some((prefix) => matches(pathname, prefix));
  if (!needsSession) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (area && session.role !== area.role) {
    return NextResponse.redirect(new URL(dashboardPathFor(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/request-quote/:path*',
    '/provider-dashboard/:path*',
    '/admin/:path*',
    '/messages/:path*',
    '/account/:path*',
    '/login',
    '/register',
  ],
};
