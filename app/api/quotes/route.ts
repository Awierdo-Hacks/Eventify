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
      // Customer ziet quotes voor eigen requests (exclude rejected quotes)
      where.request = {
        customer_id: session.id,
      };
      where.rejected_at = null; // Only show non-rejected quotes
    } else if (session.role === 'PROVIDER' && session.providerId) {
      // Provider ziet eigen quotes (including rejected ones for feedback)
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
            user_id: true,
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
      status: quote.rejected_at ? 'REJECTED' : (quote.accepted ? 'ACCEPTED' : 'PENDING'),
      createdAt: quote.created_at,
      rejectedAt: quote.rejected_at,
      rejectionReason: quote.rejection_reason,
      eventSlotId: quote.event_slot_id, // Added for filtering linked quotes
      provider: {
        id: quote.provider.id,
        businessName: quote.provider.business_name,
        category: quote.provider.category,
        location: quote.provider.location,
        userId: quote.provider.user_id,
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

// POST - Create a new quote (Provider only)
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    if (session.role !== 'PROVIDER' || !session.providerId) {
      return NextResponse.json(
        { error: 'Forbidden - only providers can create quotes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, totalPrice, message, terms, includedServices, validUntil } = body;

    // Validate required fields
    if (!requestId || !totalPrice || !message || !includedServices || includedServices.length === 0) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in (requestId, totalPrice, message, includedServices)' },
        { status: 400 }
      );
    }

    // Verify the service request exists and is for this provider
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Service request niet gevonden' },
        { status: 404 }
      );
    }

    if (serviceRequest.provider_id !== session.providerId) {
      return NextResponse.json(
        { error: 'Je kunt alleen offertes maken voor je eigen aanvragen' },
        { status: 403 }
      );
    }

    // Check if provider already sent a quote for this request
    const existingQuote = await prisma.quote.findFirst({
      where: {
        request_id: requestId,
        provider_id: session.providerId,
      },
    });

    if (existingQuote) {
      // If quote was rejected, allow re-sending (delete old and create new)
      if (existingQuote.rejected_at) {
        await prisma.quote.delete({
          where: { id: existingQuote.id },
        });
      } else {
        return NextResponse.json(
          { error: 'Je hebt al een offerte verstuurd voor deze aanvraag' },
          { status: 400 }
        );
      }
    }

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        request_id: requestId,
        provider_id: session.providerId,
        total_price: parseFloat(totalPrice),
        message,
        terms: terms || 'Standaard voorwaarden van toepassing.',
        included_services: includedServices.filter((s: string) => s.trim() !== ''),
        valid_until: validUntil ? new Date(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        accepted: false,
      },
    });

    // Update service request status to QUOTED
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'QUOTED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Offerte succesvol aangemaakt en verstuurd',
      quote: {
        id: quote.id,
        totalPrice: quote.total_price,
        packageName: quote.message,
        createdAt: quote.created_at,
      },
    });
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het aanmaken van de offerte' },
      { status: 500 }
    );
  }
}