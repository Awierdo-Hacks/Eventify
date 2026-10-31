import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';

// GET - List reviews (for a specific provider)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is verplicht' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        provider_id: providerId,
      },
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
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      verifiedBooking: !!review.booking_id,
      eventType: review.event_type,
      eventDate: review.event_date,
      createdAt: review.created_at,
      customer: {
        id: review.customer.id,
        name: review.customer.name,
      },
    }));

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 
      ? Math.round((totalRating / reviews.length) * 10) / 10 
      : 0;

    return NextResponse.json({
      reviews: formattedReviews,
      total: formattedReviews.length,
      averageRating,
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van reviews' },
      { status: 500 }
    );
  }
}

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  comment: z.string().trim().min(10).max(2000),
});

// POST - Create review: only the customer of a completed booking, once per booking
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    if (session.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Alleen klanten kunnen reviews plaatsen' },
        { status: 403 }
      );
    }

    const { data, error } = await parseBody(request, createReviewSchema);
    if (error) return error;

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { request: { select: { event_type: true } }, review: { select: { id: true } } },
    });

    if (!booking || booking.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Boeking niet gevonden' },
        { status: 404 }
      );
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Je kunt pas een review plaatsen nadat de boeking voltooid is' },
        { status: 403 }
      );
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'Je hebt al een review geplaatst voor deze boeking' },
        { status: 409 }
      );
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          booking_id: booking.id,
          customer_id: session.id,
          provider_id: booking.provider_id,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          event_type: booking.request.event_type,
          event_date: booking.event_date,
        },
        include: {
          customer: { select: { id: true, name: true } },
          provider: { select: { id: true, business_name: true } },
        },
      });

      // Recompute the average in a single statement so concurrent reviews can't overwrite each other
      await tx.$executeRaw`
        UPDATE "service_providers" SET
          "rating_avg" = COALESCE((SELECT AVG("rating")::float FROM "reviews" WHERE "provider_id" = ${booking.provider_id}), 0),
          "review_count" = (SELECT COUNT(*)::int FROM "reviews" WHERE "provider_id" = ${booking.provider_id}),
          "updated_at" = NOW()
        WHERE "id" = ${booking.provider_id}`;

      return created;
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        eventType: review.event_type,
        eventDate: review.event_date,
        createdAt: review.created_at,
        verifiedBooking: true,
        customer: {
          id: review.customer.id,
          name: review.customer.name,
        },
        provider: {
          id: review.provider.id,
          businessName: review.provider.business_name,
        },
      },
    });
  } catch (error) {
    // Unique constraint on booking_id: a second review for the same booking
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Je hebt al een review geplaatst voor deze boeking' },
        { status: 409 }
      );
    }
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het plaatsen van de review' },
      { status: 500 }
    );
  }
}
