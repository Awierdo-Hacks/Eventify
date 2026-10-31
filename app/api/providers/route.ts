import { NextResponse } from 'next/server';
import { getBrowseProviders } from '@/lib/page-data';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Only admins may list unverified/hidden providers
    const includeHidden = searchParams.get('isActive') === 'false';
    if (includeHidden) {
      const session = await getSession();
      if (session?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await getBrowseProviders({
      category: searchParams.get('category'),
      location: searchParams.get('location'),
      priceRange: searchParams.get('priceRange'),
      search: searchParams.get('search') || searchParams.get('q'),
      isActive: includeHidden ? 'false' : null,
      availableOn: searchParams.get('availableOn'),
      guests: Number(searchParams.get('guests')) || null,
      page: Number(searchParams.get('page') || 1),
      pageSize: Number(searchParams.get('pageSize') || undefined),
    });

    const res = NextResponse.json({
      providers: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
    res.headers.set(
      'Cache-Control',
      includeHidden ? 'private, no-store' : 'public, s-maxage=60, stale-while-revalidate=300'
    );
    return res;
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van providers' },
      { status: 500 }
    );
  }
}
