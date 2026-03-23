import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters uit query params
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const priceRange = searchParams.get('priceRange');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (priceRange) {
      where.price_range = priceRange;
    }

    if (search) {
      where.OR = [
        {
          business_name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Default: alleen verified en actieve providers tonen
    if (isActive !== 'false') {
      where.verified = true;
      where.is_active = true;
    }

    // Fetch providers – gebruik rating_avg uit DB, geen reviews laden nodig
    const providers = await prisma.serviceProvider.findMany({
      where,
      select: {
        id: true,
        business_name: true,
        category: true,
        description: true,
        location: true,
        price_range: true,
        images: true,
        verified: true,
        rating_avg: true,
        review_count: true,
        created_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const providersWithRating = providers.map((provider) => ({
      id: provider.id,
      businessName: provider.business_name,
      category: provider.category,
      description: provider.description,
      location: provider.location,
      priceRange: provider.price_range,
      images: provider.images,
      verified: provider.verified,
      rating: Math.round(provider.rating_avg * 10) / 10,
      reviewCount: provider.review_count,
      createdAt: provider.created_at,
      user: {
        id: provider.user.id,
        name: provider.user.name,
        email: provider.user.email,
      },
    }));

    const res = NextResponse.json({
      providers: providersWithRating,
      total: providersWithRating.length,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van providers' },
      { status: 500 }
    );
  }
}
