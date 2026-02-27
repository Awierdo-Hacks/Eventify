
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { EventType, ProviderCategory } from '@/lib/eventHelpers';

// GET - List events for current user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Only customers can have events
    if (session.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can view events' },
        { status: 403 }
      );
    }

    const events = await prisma.event.findMany({
      where: {
        customer_id: session.id,
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        slots: {
          include: {
            quotes: {
              select: {
                id: true,
                total_price: true,
                accepted: true,
                message: true,
                included_services: true,
                valid_until: true,
                created_at: true,
                provider: {
                  select: {
                    id: true,
                    business_name: true,
                    category: true,
                    location: true,
                  },
                },
              },
            },
            booked_quote: {
              select: {
                id: true,
                total_price: true,
                provider: {
                  select: {
                    id: true,
                    business_name: true,
                    category: true,
                    location: true,
                  },
                },
              },
            },
          },
          orderBy: {
            display_order: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format the response
    const formattedEvents = events.map((event) => ({
      id: event.id,
      name: event.name,
      eventType: event.event_type,
      eventDate: event.event_date,
      location: event.location,
      guestCount: event.guest_count,
      budgetMin: event.budget_min,
      budgetMax: event.budget_max,
      status: event.status,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      slots: event.slots.map((slot) => ({
        id: slot.id,
        category: slot.category,
        customName: slot.custom_name,
        isRequired: slot.is_required,
        displayOrder: slot.display_order,
        status: slot.status,
        quotesCount: slot.quotes.length,
        bookedQuote: slot.booked_quote
          ? {
              id: slot.booked_quote.id,
              totalPrice: slot.booked_quote.total_price,
              providerName: slot.booked_quote.provider.business_name,
              provider: {
                id: slot.booked_quote.provider.id,
                businessName: slot.booked_quote.provider.business_name,
                category: slot.booked_quote.provider.category,
                location: slot.booked_quote.provider.location,
              },
            }
          : null,
        quotes: slot.quotes.map((q) => ({
          id: q.id,
          totalPrice: q.total_price,
          accepted: q.accepted,
          providerName: q.provider.business_name,
          message: q.message,
          includedServices: q.included_services,
          validUntil: q.valid_until,
          createdAt: q.created_at,
          provider: {
            id: q.provider.id,
            businessName: q.provider.business_name,
            category: q.provider.category,
            location: q.provider.location,
          },
        })),
      })),
    }));

    return NextResponse.json({
      events: formattedEvents,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Create a new event
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
        { error: 'Only customers can create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      eventType,
      eventDate,
      location,
      guestCount,
      budgetMin,
      budgetMax,
      slots,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    if (!eventType || !['WEDDING', 'BIRTHDAY', 'CORPORATE', 'FESTIVAL', 'CUSTOM'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Valid event type is required' },
        { status: 400 }
      );
    }

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: 'At least one slot is required' },
        { status: 400 }
      );
    }

    // Create event with slots
    const event = await prisma.event.create({
      data: {
        customer_id: session.id,
        name: name.trim(),
        event_type: eventType as EventType,
        event_date: eventDate ? new Date(eventDate) : null,
        location: location?.trim() || null,
        guest_count: guestCount ? parseInt(guestCount) : null,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        slots: {
          create: slots.map((slot: { category: ProviderCategory; isRequired?: boolean; customName?: string }, index: number) => ({
            category: slot.category,
            custom_name: slot.customName || null,
            is_required: slot.isRequired ?? true,
            display_order: index,
            status: 'EMPTY',
          })),
        },
      },
      include: {
        slots: {
          orderBy: {
            display_order: 'asc',
          },
        },
      },
    });

    // Format response
    const formattedEvent = {
      id: event.id,
      name: event.name,
      eventType: event.event_type,
      eventDate: event.event_date,
      location: event.location,
      guestCount: event.guest_count,
      budgetMin: event.budget_min,
      budgetMax: event.budget_max,
      status: event.status,
      createdAt: event.created_at,
      slots: event.slots.map((slot) => ({
        id: slot.id,
        category: slot.category,
        customName: slot.custom_name,
        isRequired: slot.is_required,
        displayOrder: slot.display_order,
        status: slot.status,
        quotesCount: 0,
        bookedQuote: null,
        quotes: [],
      })),
    };

    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
