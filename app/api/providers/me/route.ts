import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProvider } from '@/lib/middleware/auth';

export async function GET() {
  try {
    const { error, session } = await requireProvider();
    if (error) return error;

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: session!.providerId! },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        provider_services: {
          orderBy: { created_at: 'asc' },
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
            bookings: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider profiel niet gevonden' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const totalRating = provider.reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = provider.reviews.length > 0
      ? Math.round((totalRating / provider.reviews.length) * 10) / 10
      : 0;

    return NextResponse.json({
      id: provider.id,
      businessName: provider.business_name,
      category: provider.category,
      description: provider.description || '',
      location: provider.location,
      priceRange: provider.price_range,
      services: provider.services,
      images: provider.images,
      portfolioImages: provider.portfolio_images,
      phone: provider.phone || '',
      website: provider.website || '',
      availability: provider.availability || '',
      minGuests: provider.min_guests,
      maxGuests: provider.max_guests,
      responseTime: provider.response_time || '',
      verified: provider.verified,
      isActive: provider.is_active,
      rating: averageRating,
      reviewCount: provider._count.reviews,
      bookingCount: provider._count.bookings,
      createdAt: provider.created_at,
      user: {
        id: provider.user.id,
        name: provider.user.name,
        email: provider.user.email,
        phone: provider.user.phone,
      },
      providerServices: provider.provider_services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        priceFrom: s.price_from,
        priceTo: s.price_to,
      })),
    });
  } catch (error) {
    console.error('Provider me API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van je profiel' },
      { status: 500 }
    );
  }
}
