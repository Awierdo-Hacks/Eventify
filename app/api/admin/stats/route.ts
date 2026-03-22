import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// GET - Admin dashboard stats
export async function GET() {
  try {
    const { error, session } = await requireRole('ADMIN');
    if (error) return error;

    // Get platform statistics
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalProviders,
      verifiedProviders,
      totalBookings,
      totalRevenueResult,
      monthlyRevenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.serviceProvider.count(),
      prisma.serviceProvider.count({ where: { verified: true } }),
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { final_price: true } }),
      prisma.booking.aggregate({
        _sum: { final_price: true },
        where: { created_at: { gte: firstDayOfMonth } },
      }),
    ]);

    const pendingProviders = totalProviders - verifiedProviders;
    const totalRevenue = totalRevenueResult._sum.final_price ?? 0;
    const monthlyRevenue = monthlyRevenueResult._sum.final_price ?? 0;

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
