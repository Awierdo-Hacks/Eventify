import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode, syncGoogleCalendar } from '@/lib/googleCalendarSync';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // contains providerId
  const errorParam = searchParams.get('error');

  const appUrl = process.env.NEXTAUTH_URL ?? '';

  if (errorParam || !code || !state) {
    return NextResponse.redirect(
      `${appUrl}/provider-dashboard?tab=agenda&sync=error&message=${encodeURIComponent('Google koppeling geannuleerd')}`
    );
  }

  try {
    await exchangeGoogleCode(code, state);

    // Trigger initial sync for the next 3 months
    const integration = await prisma.calendarIntegration.findUnique({
      where: { provider_id_type: { provider_id: state, type: 'GOOGLE' } },
    });
    if (integration) {
      const from = startOfMonth(new Date());
      const to = endOfMonth(addMonths(new Date(), 3));
      await syncGoogleCalendar(integration.id, from, to);
    }

    return NextResponse.redirect(
      `${appUrl}/provider-dashboard?tab=agenda&sync=google_success`
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      `${appUrl}/provider-dashboard?tab=agenda&sync=error&message=${encodeURIComponent('Google koppeling mislukt')}`
    );
  }
}
