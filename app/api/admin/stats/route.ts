import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { getAdminStats } from '@/lib/page-data';

// GET - Admin dashboard stats
export async function GET() {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    return NextResponse.json(await getAdminStats());
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van statistieken' },
      { status: 500 }
    );
  }
}
