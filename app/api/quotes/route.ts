import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List quotes
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
    const requestId = searchParams.get('requestId');
    const status = searchParams.get('status');

    const where: any = {};

    if (session.role === 'CUSTOMER') {
      // Customer ziet quotes voor eigen requests
      where.request = {
        customer_id: session.id,
      };
    } else if (session.role === 'PROVIDER' && session.providerId) {
      // Provider ziet eigen quotes
      where.provider_id = session.providerId;
    } else if (session.role === 'ADMIN') {
      // Admin ziet alles
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (requestId) {
      where.request_id = requestId;
    }

    if (status) {
      where.accepted = status === 'ACCEPTED';
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            business_name: true,
            category: true,
            location: true,
          },
        },
        request: {
          select: {
            id: true,
            event_type: true,
            event_date: true,
            event_location: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedQuotes = quotes.map((quote) => ({
      id: quote.id,
      totalPrice: quote.total_price,
      packageName: quote.message || 'Offerte pakket',
      packageDescription: quote.terms || '',
      includedServices: quote.included_services,
      validUntil: quote.valid_until,
      status: quote.accepted ? 'ACCEPTED' : 'PENDING',
      createdAt: quote.created_at,
      provider: {
        id: quote.provider.id,
        businessName: quote.provider.business_name,
        category: quote.provider.category,
        location: quote.provider.location,
      },
      serviceRequest: {
        id: quote.request.id,
        eventType: quote.request.event_type,
        eventDate: quote.request.event_date,
        eventLocation: quote.request.event_location,
        customer: {
          id: quote.request.customer.id,
          name: quote.request.customer.name,
        },
      },
    }));

    return NextResponse.json({
      quotes: formattedQuotes,
      total: formattedQuotes.length,
    });
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van offertes' },
      { status: 500 }
    );
  }
}