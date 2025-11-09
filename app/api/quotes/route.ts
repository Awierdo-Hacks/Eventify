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
      where.service_request = {
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
      where.status = status;
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
        serviceRequest: {
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
      packageName: quote.package_name,
      packageDescription: quote.package_description,
      includedServices: quote.included_services,
      excludedServices: quote.excluded_services,
      validUntil: quote.valid_until,
      status: quote.status,
      notes: quote.notes,
      createdAt: quote.created_at,
      provider: {
        id: quote.provider.id,
        businessName: quote.provider.business_name,
        category: quote.provider.category,
        location: quote.provider.location,
      },
      serviceRequest: {
        id: quote.service_request.id,
        eventType: quote.service_request.event_type,
        eventDate: quote.service_request.event_date,
        eventLocation: quote.service_request.event_location,
        customer: {
          id: quote.service_request.customer.id,
          name: quote.service_request.customer.name,
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

// POST - Create new quote (providers only)
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
        { error: 'Only providers can create quotes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      requestId,
      totalPrice,
      packageName,
      packageDescription,
      includedServices,
      excludedServices,
      validUntil,
      notes,
    } = body;

    // Validatie
    if (!requestId || !totalPrice || !packageName) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    // Check if request exists and is not already quoted by this provider
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: {
          where: {
            provider_id: session.providerId,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Aanvraag niet gevonden' },
        { status: 404 }
      );
    }

    if (serviceRequest.quotes.length > 0) {
      return NextResponse.json(
        { error: 'Je hebt al een offerte ingediend voor deze aanvraag' },
        { status: 400 }
      );
    }

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        request_id: requestId,
        provider_id: session.providerId,
        total_price: parseFloat(totalPrice),
        package_name: packageName,
        package_description: packageDescription || null,
        included_services: includedServices || [],
        excluded_services: excludedServices || [],
        valid_until: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        provider: {
          select: {
            id: true,
            business_name: true,
          },
        },
        service_request: {
          select: {
            id: true,
            event_type: true,
            event_date: true,
          },
        },
      },
    });

    // Update service request status to QUOTED
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'QUOTED' },
    });

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        totalPrice: quote.total_price,
        packageName: quote.package_name,
        packageDescription: quote.package_description,
        includedServices: quote.included_services,
        excludedServices: quote.excluded_services,
        validUntil: quote.valid_until,
        status: quote.status,
        notes: quote.notes,
        createdAt: quote.created_at,
        provider: {
          id: quote.provider.id,
          businessName: quote.provider.business_name,
        },
        serviceRequest: {
          id: quote.service_request.id,
          eventType: quote.service_request.event_type,
          eventDate: quote.service_request.event_date,
        },
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
