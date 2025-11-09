import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

// POST - Create review (only after completed booking)
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

    const body = await request.json();
    const { providerId, bookingId, rating, title, comment, eventType, eventDate } = body;

    // Validatie
    if (!providerId || !rating || !title || !comment) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating moet tussen 1 en 5 zijn' },
        { status: 400 }
      );
    }

    // Check if booking exists and is completed (if bookingId provided)
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Boeking niet gevonden' },
          { status: 404 }
        );
      }

      if (booking.customer_id !== session.id) {
        return NextResponse.json(
          { error: 'Dit is niet jouw boeking' },
          { status: 403 }
        );
      }

      if (booking.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Je kunt alleen reviews plaatsen voor afgeronde boekingen' },
          { status: 400 }
        );
      }

      // Check if review already exists for this booking
      const existingReview = await prisma.review.findFirst({
        where: {
          customer_id: session.id,
          provider_id: providerId,
          event_date: booking.event_date,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: 'Je hebt al een review geplaatst voor deze boeking' },
          { status: 400 }
        );
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        customer_id: session.id,
        provider_id: providerId,
        rating,
        title,
        comment,
        event_type: eventType || 'General',
        event_date: eventDate ? new Date(eventDate) : new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        provider: {
          select: {
            id: true,
            business_name: true,
          },
        },
      },
    });

    // Update provider's average rating and review count
    const allReviews = await prisma.review.findMany({
      where: { provider_id: providerId },
      select: { rating: true },
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = allReviews.length > 0 
      ? totalRating / allReviews.length 
      : 0;

    await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        rating_avg: averageRating,
        review_count: allReviews.length,
      },
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
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het plaatsen van de review' },
      { status: 500 }
    );
  }
}
