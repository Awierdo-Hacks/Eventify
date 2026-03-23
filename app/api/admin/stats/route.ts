import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// GET - Admin dashboard stats
export async function GET() {
  try {
    const { error } = await requireRole('ADMIN');
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
      recentBookings,
      recentProviders,
      recentUsers,
      recentReviews,
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
      // Recent activity
      prisma.booking.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          created_at: true,
          customer: { select: { name: true } },
          provider: { select: { business_name: true, category: true } },
        },
      }),
      prisma.serviceProvider.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          business_name: true,
          created_at: true,
          verified: true,
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          role: true,
          created_at: true,
        },
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          rating: true,
          created_at: true,
          customer: { select: { name: true } },
          provider: { select: { business_name: true } },
        },
      }),
    ]);

    const pendingProviders = totalProviders - verifiedProviders;
    const totalRevenue = totalRevenueResult._sum.final_price ?? 0;
    const monthlyRevenue = monthlyRevenueResult._sum.final_price ?? 0;

    // Merge and sort recent activity
    const recentActivity = [
      ...recentBookings.map((b) => ({
        type: 'booking' as const,
        message: `Nieuwe Boeking: ${b.customer.name} - ${b.provider.business_name}`,
        timestamp: b.created_at,
      })),
      ...recentProviders.map((p) => ({
        type: p.verified ? 'provider_verified' as const : 'provider_new' as const,
        message: p.verified
          ? `Provider Geverifieerd: ${p.business_name}`
          : `Nieuwe Provider: ${p.business_name}`,
        timestamp: p.created_at,
      })),
      ...recentUsers.filter((u) => u.role === 'CUSTOMER').map((u) => ({
        type: 'user' as const,
        message: `Nieuwe User: ${u.name}`,
        timestamp: u.created_at,
      })),
      ...recentReviews.map((r) => ({
        type: 'review' as const,
        message: `Review Ontvangen: ${r.customer.name}`,
        timestamp: r.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalUsers,
      totalProviders,
      verifiedProviders,
      pendingProviders,
      totalBookings,
      totalRevenue,
      monthlyRevenue,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van statistieken' },
      { status: 500 }
    );
  }
}
