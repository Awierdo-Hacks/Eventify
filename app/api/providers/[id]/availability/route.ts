import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Publiek endpoint: haal niet-beschikbare datums op voor een provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Controleer of provider bestaat
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: { id: true, availability: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider niet gevonden' },
        { status: 404 }
      );
    }

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const dateWhere = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

    const [blockedDates, bookings, externalEvents] = await Promise.all([
      prisma.blockedDate.findMany({
        where: {
          provider_id: providerId,
          ...(dateWhere ? { date: dateWhere } : {}),
        },
        select: { date: true },
      }),
      prisma.booking.findMany({
        where: {
          provider_id: providerId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          ...(dateWhere ? { event_date: dateWhere } : {}),
        },
        select: { event_date: true },
      }),
      prisma.externalCalendarEvent.findMany({
        where: {
          integration: { provider_id: providerId, is_active: true },
          ...(dateWhere ? { start_date: dateWhere } : {}),
        },
        select: { start_date: true },
      }),
    ]);

    // Combineer alle bronnen in één lijst
    const unavailableSet = new Set<string>();
    for (const d of blockedDates) {
      unavailableSet.add(d.date.toISOString().split('T')[0]);
    }
    for (const b of bookings) {
      unavailableSet.add(b.event_date.toISOString().split('T')[0]);
    }
    for (const e of externalEvents) {
      unavailableSet.add(e.start_date.toISOString().split('T')[0]);
    }

    const res = NextResponse.json({
      unavailableDates: Array.from(unavailableSet).sort(),
      availability: provider.availability,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res;
  } catch (error) {
    console.error('Availability GET error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van beschikbaarheid' },
      { status: 500 }
    );
  }
}
