import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get all reviews for a specific provider
export async function GET(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;

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

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 
      ? Math.round((totalRating / reviews.length) * 10) / 10 
      : 0;

    return NextResponse.json({
      reviews: formattedReviews,
      total: formattedReviews.length,
      averageRating,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Provider reviews API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van reviews' },
      { status: 500 }
    );
  }
}
