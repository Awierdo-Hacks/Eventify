import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { getAdminProviders } from '@/lib/page-data';

// GET - List providers for admin review
export async function GET(request: Request) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const result = await getAdminProviders({
      verified: searchParams.get('verified'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });

    return NextResponse.json({
      providers: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Admin providers API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van providers' },
      { status: 500 }
    );
  }
}
