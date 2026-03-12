import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProvider } from '@/lib/middleware/auth';
import { canAccessProviderResource } from '@/lib/middleware/auth';
import { PriceRange } from '@/generated/prisma/client';

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

// Valid price ranges for validation
const VALID_PRICE_RANGES: PriceRange[] = ['LOW', 'MEDIUM', 'HIGH', 'PREMIUM'];

// Map display price range to enum
function mapPriceRange(range: string): PriceRange | null {
  const map: Record<string, PriceRange> = {
    'LOW': 'LOW',
    'MEDIUM': 'MEDIUM',
    'HIGH': 'HIGH',
    'PREMIUM': 'PREMIUM',
  };
  return map[range] || null;
}

// PATCH - Update provider profile (provider only, own profile)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireProvider();
    if (error) return error;

    const { id: providerId } = await params;

    // Ownership check
    if (!canAccessProviderResource(session!, providerId)) {
      return NextResponse.json(
        { error: 'Je hebt geen toegang tot dit profiel' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const errors: Record<string, string> = {};

    if (body.businessName !== undefined && !body.businessName?.trim()) {
      errors.businessName = 'Bedrijfsnaam is verplicht';
    }
    if (body.location !== undefined && !body.location?.trim()) {
      errors.location = 'Locatie is verplicht';
    }
    if (body.category !== undefined && !body.category?.trim()) {
      errors.category = 'Categorie is verplicht';
    }
    if (body.description !== undefined && body.description.trim().length < 50) {
      errors.description = 'Beschrijving moet minimaal 50 karakters zijn';
    }
    if (body.priceRange !== undefined && !VALID_PRICE_RANGES.includes(body.priceRange)) {
      errors.priceRange = 'Ongeldige prijsklasse';
    }
    if (body.minGuests !== undefined && body.minGuests !== null && (typeof body.minGuests !== 'number' || body.minGuests < 0)) {
      errors.minGuests = 'Ongeldig minimum aantal gasten';
    }
    if (body.maxGuests !== undefined && body.maxGuests !== null && (typeof body.maxGuests !== 'number' || body.maxGuests < 0)) {
      errors.maxGuests = 'Ongeldig maximum aantal gasten';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Build update data - only include fields that were sent
    const updateData: Record<string, unknown> = {};

    if (body.businessName !== undefined) updateData.business_name = body.businessName.trim();
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.location !== undefined) updateData.location = body.location.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.priceRange !== undefined) updateData.price_range = body.priceRange;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.website !== undefined) updateData.website = body.website?.trim() || null;
    if (body.availability !== undefined) updateData.availability = body.availability?.trim() || null;
    if (body.responseTime !== undefined) updateData.response_time = body.responseTime?.trim() || null;
    if (body.minGuests !== undefined) updateData.min_guests = body.minGuests || null;
    if (body.maxGuests !== undefined) updateData.max_guests = body.maxGuests || null;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.portfolioImages !== undefined) updateData.portfolio_images = body.portfolioImages;
    if (body.services !== undefined) updateData.services = body.services;

    // Transaction: update provider + replace services
    const result = await prisma.$transaction(async (tx) => {
      // Update provider
      const provider = await tx.serviceProvider.update({
        where: { id: providerId },
        data: updateData,
      });

      // Replace provider services if provided
      if (body.providerServices !== undefined) {
        // Delete all existing services
        await tx.providerService.deleteMany({
          where: { provider_id: providerId },
        });

        // Create new services
        if (body.providerServices.length > 0) {
          await tx.providerService.createMany({
            data: body.providerServices.map(
              (service: { name: string; description?: string; priceFrom: number; priceTo?: number | null }) => ({
                provider_id: providerId,
                name: service.name,
                description: service.description || null,
                price_from: service.priceFrom,
                price_to: service.priceTo || null,
              })
            ),
          });
        }
      }

      return provider;
    });

    return NextResponse.json({
      success: true,
      message: 'Profiel bijgewerkt',
      provider: {
        id: result.id,
        businessName: result.business_name,
        category: result.category,
        location: result.location,
      },
    });
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het bijwerken van je profiel' },
      { status: 500 }
    );
  }
}