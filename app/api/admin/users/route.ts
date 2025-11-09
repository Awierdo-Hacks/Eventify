import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// GET - List all users (admin only)
export async function GET(request: Request) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            business_name: true,
            verified: true,
          },
        },
        _count: {
          select: {
            service_requests: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      provider: user.provider
        ? {
            id: user.provider.id,
            businessName: user.provider.business_name,
            verified: user.provider.verified,
          }
        : null,
      stats: {
        requests: user._count.service_requests,
        bookings: user._count.bookings,
        reviews: user._count.reviews,
      },
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van gebruikers' },
      { status: 500 }
    );
  }
}
