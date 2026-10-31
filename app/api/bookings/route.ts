import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getBookingsForSession } from '@/lib/page-data';

// GET - List bookings
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Same data shape as the server-rendered dashboards (lib/page-data.ts)
    const bookings = await getBookingsForSession(session, { status: searchParams.get('status') });

    return NextResponse.json({
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('bookings API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van boekingen' },
      { status: 500 }
    );
  }
}
