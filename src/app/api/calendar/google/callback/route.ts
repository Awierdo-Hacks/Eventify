import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { getCurrentUser } from '@/lib/session';
import { connectGoogleCalendar, googleCalendarConfigured, verifyGoogleState } from '@/features/calendar/google';
import { syncProviderCalendars } from '@/features/calendar/sync';

const agenda = (query: string) => NextResponse.redirect(`${env.appUrl}/provider-dashboard/agenda?${query}`);

/**
 * Google redirects here after the provider grants (or refuses) access. The
 * connection is only stored when the signed state matches the provider who is
 * signed in right now.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const user = await getCurrentUser();
  if (!user || user.role !== 'PROVIDER' || !user.providerId) {
    return NextResponse.redirect(`${env.appUrl}/login?redirect=/provider-dashboard/agenda`);
  }
  if (searchParams.get('error') || !code || !state || !googleCalendarConfigured()) return agenda('sync=cancelled');

  const providerId = await verifyGoogleState(state);
  if (!providerId || providerId !== user.providerId) return agenda('sync=error');

  try {
    await connectGoogleCalendar(code, providerId);
    await syncProviderCalendars(providerId, { force: true });
    return agenda('sync=connected');
  } catch (error) {
    console.error('[calendar] google callback failed', error);
    return agenda('sync=error');
  }
}
