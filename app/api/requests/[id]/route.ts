import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const { id: requestId } = await params;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
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
        quotes: {
          include: {
            provider: {
              select: {
                id: true,
                business_name: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
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

    // Check authorization
    const isOwner = serviceRequest.customer_id === session.id;
    const isProvider = serviceRequest.provider_id === session.providerId;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwner && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - geen toegang tot deze aanvraag' },
        { status: 403 }
      );
    }

    const response = {
      id: serviceRequest.id,
      category: serviceRequest.category,
      eventType: serviceRequest.event_type,
      eventDate: serviceRequest.event_date,
      eventLocation: serviceRequest.event_location,
      guestCount: serviceRequest.guest_count,
      budgetRange: serviceRequest.budget_range,
      description: serviceRequest.description,
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
            category: serviceRequest.provider.category,
            location: serviceRequest.provider.location,
            images: serviceRequest.provider.images,
          }
        : null,
      quotes: serviceRequest.quotes.map((quote) => ({
        id: quote.id,
        totalPrice: quote.total_price,
        packageName: quote.message || 'Offerte pakket',
        packageDescription: quote.terms || '',
        includedServices: quote.included_services,
        validUntil: quote.valid_until,
        accepted: quote.accepted,
        createdAt: quote.created_at,
        provider: {
          id: quote.provider.id,
          businessName: quote.provider.business_name,
        },
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Service request detail API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van de aanvraag' },
      { status: 500 }
    );
  }
}
