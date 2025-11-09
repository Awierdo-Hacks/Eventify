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
      verifiedProviders,
      totalBookings,
      bookingsWithRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.serviceProvider.count(),
      prisma.serviceProvider.count({ where: { verified: true } }),
      prisma.booking.count(),
      prisma.booking.findMany({
        select: {
          final_price: true,
          created_at: true,
        },
      }),
    ]);

    const pendingProviders = totalProviders - verifiedProviders;

    // Calculate total revenue
    const totalRevenue = bookingsWithRevenue.reduce((sum, booking) => sum + booking.final_price, 0);

    // Calculate monthly revenue (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = bookingsWithRevenue
      .filter(booking => new Date(booking.created_at) >= firstDayOfMonth)
      .reduce((sum, booking) => sum + booking.final_price, 0);

    return NextResponse.json({
      totalUsers,
      totalProviders,
      verifiedProviders,
      pendingProviders,
      totalBookings,
      totalRevenue,
      monthlyRevenue,
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van statistieken' },
      { status: 500 }
    );
  }
}
