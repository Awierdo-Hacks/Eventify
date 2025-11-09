import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params;

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        bookings: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            id: true,
            event_date: true,
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
        { error: 'Provider niet gevonden' },
        { status: 404 }
      );
    }

    // Bereken average rating
    const totalRating = provider.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = provider.reviews.length > 0 
      ? Math.round((totalRating / provider.reviews.length) * 10) / 10 
      : 0;

    // Format response
    const response = {
      id: provider.id,
      businessName: provider.business_name,
      category: provider.category,
      description: provider.description,
      location: provider.location,
      priceRange: provider.price_range,
      services: provider.services,
      images: provider.images,
      availability: provider.availability,
      minGuests: provider.min_guests,
      maxGuests: provider.max_guests,
      responseTime: provider.response_time,
      verified: provider.verified,
      rating: averageRating,
      reviewCount: provider._count.reviews,
      bookingCount: provider._count.bookings,
      createdAt: provider.created_at,
      user: {
        id: provider.user.id,
        name: provider.user.name,
        email: provider.user.email,
      },
      reviews: provider.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        customer: {
          id: review.customer.id,
          name: review.customer.name,
        },
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Provider detail API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van provider details' },
      { status: 500 }
    );
  }
}
