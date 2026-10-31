import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUnavailableDates } from '@/lib/availability';

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

    const unavailableDates = await getUnavailableDates(providerId, {
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null,
    });

    const res = NextResponse.json({
      unavailableDates,
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
