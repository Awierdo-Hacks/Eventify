import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List service requests
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
    const providerId = searchParams.get('providerId');

    // Build where clause based on user role
    const where: any = {};

    if (session.role === 'CUSTOMER') {
      // Customer ziet alleen eigen requests
      where.customer_id = session.id;
    } else if (session.role === 'PROVIDER' && session.providerId) {
      // Provider ziet requests gericht aan hem
      where.provider_id = session.providerId;
    } else if (session.role === 'ADMIN') {
      // Admin ziet alles
      // Optioneel filter op provider
      if (providerId) {
        where.provider_id = providerId;
      }
    } else {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    const requests = await prisma.serviceRequest.findMany({
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
          },
        },
        quotes: {
          select: {
            id: true,
            total_price: true,
            accepted: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      category: req.category,
      eventType: req.event_type,
      eventDate: req.event_date,
      eventLocation: req.event_location,
      guestCount: req.guest_count,
      budgetRange: req.budget_range,
      description: req.description,
      status: req.status,
      customerName: req.customer_name,
      customerEmail: req.customer_email,
      customerPhone: req.customer_phone,
      preferredContact: req.preferred_contact,
      createdAt: req.created_at,
      customer: {
        id: req.customer.id,
        name: req.customer.name,
        email: req.customer.email,
      },
      provider: req.provider
        ? {
            id: req.provider.id,
            businessName: req.provider.business_name,
            category: req.provider.category,
            location: req.provider.location,
          }
        : null,
      quotes: req.quotes.map((quote) => ({
        id: quote.id,
        totalPrice: quote.total_price,
        accepted: quote.accepted,
      })),
    }));

    return NextResponse.json({
      requests: formattedRequests,
      total: formattedRequests.length,
    });
  } catch (error) {
    console.error('Service requests API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van aanvragen' },
      { status: 500 }
    );
  }
}

// POST - Create new service request
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    if (session.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can create service requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      providerId,
      category,
      eventType,
      eventDate,
      eventLocation,
      guestCount,
      budgetRange,
      description,
      customerName,
      customerEmail,
      customerPhone,
      preferredContact,
    } = body;

    console.log('Received request body:', body);

    // Validatie
    if (!category || !eventType || !eventDate || !eventLocation || !guestCount || !customerName || !customerEmail || !customerPhone) {
      console.log('Validation failed:', {
        category: !!category,
        eventType: !!eventType,
        eventDate: !!eventDate,
        eventLocation: !!eventLocation,
        guestCount: !!guestCount,
        customerName: !!customerName,
        customerEmail: !!customerEmail,
        customerPhone: !!customerPhone,
      });
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customer_id: session.id,
        provider_id: providerId || null,
        category,
        event_type: eventType,
        event_date: new Date(eventDate),
        event_location: eventLocation,
        guest_count: guestCount,
        budget_range: budgetRange,
        description: description || '',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        preferred_contact: preferredContact || null,
        status: 'PENDING',
      },
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: serviceRequest.id,
        category: serviceRequest.category,
        eventType: serviceRequest.event_type,
        eventDate: serviceRequest.event_date,
        eventLocation: serviceRequest.event_location,
        guestCount: serviceRequest.guest_count,
        budgetRange: serviceRequest.budget_range,
        description: serviceRequest.description,
        customerName: serviceRequest.customer_name,
        customerEmail: serviceRequest.customer_email,
        customerPhone: serviceRequest.customer_phone,
        preferredContact: serviceRequest.preferred_contact,
        status: serviceRequest.status,
        createdAt: serviceRequest.created_at,
        customer: {
          id: serviceRequest.customer.id,
          name: serviceRequest.customer.name,
          email: serviceRequest.customer.email,
        },
        provider: serviceRequest.provider
          ? {
              id: serviceRequest.provider.id,
              businessName: serviceRequest.provider.business_name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Create service request error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het aanmaken van de aanvraag' },
      { status: 500 }
    );
  }
}
