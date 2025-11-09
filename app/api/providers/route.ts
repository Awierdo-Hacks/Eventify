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

    // Default: alleen verified providers tonen (geen is_active veld in schema)
    if (isActive !== 'false') {
      where.verified = true;
    }

    // Fetch providers
    const providers = await prisma.serviceProvider.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Bereken average rating voor elke provider
    const providersWithRating = providers.map((provider) => {
      const totalRating = provider.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = provider.reviews.length > 0 
        ? Math.round((totalRating / provider.reviews.length) * 10) / 10 
        : 0;

      return {
        id: provider.id,
        businessName: provider.business_name,
        category: provider.category,
        description: provider.description,
        location: provider.location,
        priceRange: provider.price_range,
        images: provider.images,
        verified: provider.verified,
        rating: averageRating,
        reviewCount: provider._count.reviews,
        createdAt: provider.created_at,
        user: {
          id: provider.user.id,
          name: provider.user.name,
          email: provider.user.email,
        },
      };
    });

    return NextResponse.json({
      providers: providersWithRating,
      total: providersWithRating.length,
    });
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van providers' },
      { status: 500 }
    );
  }
}
