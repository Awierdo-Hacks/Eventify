import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const STATE_COOKIE = 'gcal_oauth_state';

function statesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const appUrl = process.env.NEXTAUTH_URL ?? '';
  const fail = (message: string) => {
    const response = NextResponse.redirect(
      `${appUrl}/provider-dashboard?tab=agenda&sync=error&message=${encodeURIComponent(message)}`
    );
    response.cookies.delete({ name: STATE_COOKIE, path: '/api/calendar/google' });
    return response;
  };

  if (errorParam || !code || !state) {
    return fail('Google koppeling geannuleerd');
  }

  // The state must match the one we issued to this browser
  if (!statesMatch(state, request.cookies.get(STATE_COOKIE)?.value)) {
    return fail('Google koppeling verlopen. Probeer opnieuw.');
  }

  // The calendar is always linked to the logged-in provider
  const session = await getSession();
  if (!session || session.role !== 'PROVIDER' || !session.providerId) {
    return fail('Log in als provider om je agenda te koppelen');
  }
  const providerId = session.providerId;

  try {
    const { exchangeGoogleCode, syncGoogleCalendar } = await import('@/lib/googleCalendarSync');
    await exchangeGoogleCode(code, providerId);

    // Trigger initial sync for the next 3 months
    const integration = await prisma.calendarIntegration.findUnique({
      where: { provider_id_type: { provider_id: providerId, type: 'GOOGLE' } },
    });
    if (integration) {
      const from = startOfMonth(new Date());
      const to = endOfMonth(addMonths(new Date(), 3));
      await syncGoogleCalendar(integration.id, from, to);
    }

    const response = NextResponse.redirect(
      `${appUrl}/provider-dashboard?tab=agenda&sync=google_success`
    );
    response.cookies.delete({ name: STATE_COOKIE, path: '/api/calendar/google' });
    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return fail('Google koppeling mislukt');
  }
}
