import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireProvider } from '@/lib/middleware/auth';

const STATE_COOKIE = 'gcal_oauth_state';

export async function GET() {
  const { error } = await requireProvider();
  if (error) return error;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json(
      { error: 'Google Calendar integratie is nog niet geconfigureerd' },
      { status: 503 }
    );
  }

  // Random, single-use state bound to this browser (CSRF protection).
  // The callback takes the provider from the session, never from the state.
  const state = randomBytes(32).toString('hex');
  const { getGoogleAuthUrl } = await import('@/lib/googleCalendarSync');
  const response = NextResponse.redirect(getGoogleAuthUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/api/calendar/google',
  });
  return response;
}
