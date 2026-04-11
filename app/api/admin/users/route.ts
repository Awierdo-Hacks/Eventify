import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { getAdminUsers } from '@/lib/page-data';

// GET - List all users (admin only)
export async function GET(request: Request) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const result = await getAdminUsers({
      role: searchParams.get('role'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });

    return NextResponse.json({
      users: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van gebruikers' },
      { status: 500 }
    );
  }
}
