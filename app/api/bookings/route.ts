import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List bookings
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};

    if (session.role === 'CUSTOMER') {
      // Customer ziet alleen eigen bookings
      where.customer_id = session.id;
    } else if (session.role === 'PROVIDER' && session.providerId) {
      // Provider ziet bookings voor hun business
      where.provider_id = session.providerId;
    } else if (session.role === 'ADMIN') {
      // Admin ziet alles
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            business_name: true,
            category: true,
            location: true,
            images: true,
          },
        },
        request: {
          select: {
            id: true,
            event_type: true,
            description: true,
            quotes: {
              where: {
                accepted: true,
              },
              select: {
                id: true,
                total_price: true,
                included_services: true,
                terms: true,
                message: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        event_date: 'desc',
      },
    });

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      eventDate: booking.event_date,
      eventLocation: booking.event_location,
      guestCount: booking.guest_count,
      finalPrice: booking.final_price,
      status: booking.status,
      paymentStatus: booking.payment_status,
      specialRequests: booking.special_requests,
      createdAt: booking.created_at,
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
        email: booking.customer.email,
      },
      provider: {
        id: booking.provider.id,
        businessName: booking.provider.business_name,
        category: booking.provider.category,
        location: booking.provider.location,
        images: booking.provider.images,
      },
      request: {
        id: booking.request.id,
        eventType: booking.request.event_type,
        description: booking.request.description,
      },
      quote: booking.request.quotes[0] ? {
        id: booking.request.quotes[0].id,
        packageName: booking.request.quotes[0].message || 'Pakket',
        includedServices: booking.request.quotes[0].included_services,
        terms: booking.request.quotes[0].terms,
      } : null,
    }));

    return NextResponse.json({
      bookings: formattedBookings,
      total: formattedBookings.length,
    });
  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van boekingen' },
      { status: 500 }
    );
  }
}
