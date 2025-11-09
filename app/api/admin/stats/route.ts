import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// GET - Admin dashboard stats
export async function GET() {
  try {
    const { error, session } = await requireRole('ADMIN');
    if (error) return error;

    // Get platform statistics
    const [
      totalUsers,
      totalProviders,
      totalRequests,
      totalBookings,
      totalReviews,
      pendingProviders,
      activeRequests,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.serviceProvider.count(),
      prisma.serviceRequest.count(),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.serviceProvider.count({
        where: { verified: false },
      }),
      prisma.serviceRequest.count({
        where: {
          status: {
            in: ['PENDING', 'QUOTED'],
          },
        },
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          customer: {
            select: { name: true },
          },
          provider: {
            select: { business_name: true },
          },
        },
      }),
    ]);

    // Calculate revenue (sum of completed bookings)
    const revenue = await prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        final_price: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProviders,
        totalRequests,
        totalBookings,
        totalReviews,
        pendingProviders,
        activeRequests,
        totalRevenue: revenue._sum.final_price || 0,
      },
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customer.name,
        providerName: booking.provider.business_name,
        eventDate: booking.event_date,
        finalPrice: booking.final_price,
        status: booking.status,
        createdAt: booking.created_at,
      })),
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van statistieken' },
      { status: 500 }
    );
  }
}
