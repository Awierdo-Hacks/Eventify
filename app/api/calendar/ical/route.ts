import { NextRequest, NextResponse } from 'next/server';
import { requireProvider } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';

// POST - iCal URL koppelen
export async function POST(request: NextRequest) {
  const { error, session } = await requireProvider();
  if (error) return error;

  const body = await request.json();
  const { url } = body as { url: string };

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Geef een geldige iCal URL op' }, { status: 400 });
  }

  const trimmedUrl = url.trim();

  // Validate URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return NextResponse.json({ error: 'Ongeldige URL formaat' }, { status: 400 });
  }

  // Test if URL is reachable
  try {
    const { validateIcalUrl } = await import('@/lib/icalSync');
    await validateIcalUrl(trimmedUrl);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }

  const providerId = session!.providerId!;

  const integration = await prisma.calendarIntegration.upsert({
    where: { provider_id_type: { provider_id: providerId, type: 'ICAL' } },
    create: {
      provider_id: providerId,
      type: 'ICAL',
      is_active: true,
      ical_url: trimmedUrl,
      sync_error: null,
    },
    update: {
      is_active: true,
      ical_url: trimmedUrl,
      ical_last_etag: null,
      sync_error: null,
    },
  });

  // Initial sync
  try {
    const { syncIcalCalendar } = await import('@/lib/icalSync');
    const from = startOfMonth(new Date());
    const to = endOfMonth(addMonths(new Date(), 3));
    await syncIcalCalendar(integration.id, from, to);
  } catch (err) {
    // Non-fatal — integration is saved, sync can be retried
    console.error('Initial iCal sync failed:', err);
  }

  return NextResponse.json({ success: true });
}

// DELETE - iCal koppeling verwijderen
export async function DELETE() {
  const { error, session } = await requireProvider();
  if (error) return error;

  try {
    const { disconnectIcalCalendar } = await import('@/lib/icalSync');
    await disconnectIcalCalendar(session!.providerId!);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('iCal disconnect error:', err);
    return NextResponse.json({ error: 'Kon iCal koppeling niet verwijderen' }, { status: 500 });
  }
}
