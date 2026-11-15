import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getCurrentUser } from '@/lib/session';
import { createGoogleAuthUrl, googleCalendarConfigured } from '@/features/calendar/google';

const agenda = (query: string) => `${env.appUrl}/provider-dashboard/agenda?${query}`;

/** Start the Google OAuth flow for the signed-in provider. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PROVIDER' || !user.providerId) {
    return NextResponse.redirect(`${env.appUrl}/login?redirect=/provider-dashboard/agenda`);
  }
  if (!googleCalendarConfigured()) return NextResponse.redirect(agenda('sync=unavailable'));
  return NextResponse.redirect(await createGoogleAuthUrl(user.providerId));
}
