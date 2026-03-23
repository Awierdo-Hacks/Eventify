import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// GET - List providers for admin review
export async function GET(request: Request) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const verified = searchParams.get('verified');

    const where: any = {};

    if (verified === 'false') {
      where.verified = false;
    } else if (verified === 'true') {
      where.verified = true;
    }

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
        _count: {
          select: {
            service_requests: true,
            quotes: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedProviders = providers.map((provider) => ({
      id: provider.id,
      businessName: provider.business_name,
      category: provider.category,
      description: provider.description,
      location: provider.location,
      verified: provider.verified,
      isActive: provider.is_active,
      images: provider.images,
      portfolioImages: provider.portfolio_images,
      phone: provider.phone,
      btwNumber: provider.btw_number,
      ratingAvg: provider.rating_avg,
      reviewCount: provider.review_count,
      createdAt: provider.created_at,
      user: {
        id: provider.user.id,
        name: provider.user.name,
        email: provider.user.email,
      },
      stats: {
        requests: provider._count.service_requests,
        quotes: provider._count.quotes,
        bookings: provider._count.bookings,
        reviews: provider._count.reviews,
      },
    }));

    return NextResponse.json({
      providers: formattedProviders,
      total: formattedProviders.length,
    });
  } catch (error) {
    console.error('Admin providers API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van providers' },
      { status: 500 }
    );
  }
}
