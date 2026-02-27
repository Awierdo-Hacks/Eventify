import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Get single event with all details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        slots: {
          include: {
            quotes: {
              include: {
                provider: {
                  select: {
                    id: true,
                    business_name: true,
                    category: true,
                    location: true,
                    rating_avg: true,
                    images: true,
                  },
                },
              },
              orderBy: {
                created_at: 'desc',
              },
            },
            booked_quote: {
              include: {
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
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (event.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this event' },
        { status: 403 }
      );
    }

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
      updatedAt: event.updated_at,
      slots: event.slots.map((slot: any) => ({
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
              provider: {
                id: slot.booked_quote.provider.id,
                businessName: slot.booked_quote.provider.business_name,
                category: slot.booked_quote.provider.category,
                location: slot.booked_quote.provider.location,
              },
            }
          : null,
        quotes: slot.quotes.map((q: any) => ({
          id: q.id,
          totalPrice: q.total_price,
          includedServices: q.included_services,
          validUntil: q.valid_until,
          message: q.message,
          accepted: q.accepted,
          createdAt: q.created_at,
          provider: {
            id: q.provider.id,
            businessName: q.provider.business_name,
            category: q.provider.category,
            location: q.provider.location,
            rating: q.provider.rating_avg,
            image: q.provider.images?.[0] || null,
          },
        })),
      })),
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PATCH - Update event details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Check ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { customer_id: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, eventDate, location, guestCount, budgetMin, budgetMax, status } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (eventDate !== undefined) updateData.event_date = eventDate ? new Date(eventDate) : null;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (guestCount !== undefined) updateData.guest_count = guestCount ? parseInt(guestCount) : null;
    if (budgetMin !== undefined) updateData.budget_min = budgetMin ? parseFloat(budgetMin) : null;
    if (budgetMax !== undefined) updateData.budget_max = budgetMax ? parseFloat(budgetMax) : null;
    if (status !== undefined && ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        slots: {
          orderBy: {
            display_order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      eventType: updatedEvent.event_type,
      eventDate: updatedEvent.event_date,
      location: updatedEvent.location,
      guestCount: updatedEvent.guest_count,
      budgetMin: updatedEvent.budget_min,
      budgetMax: updatedEvent.budget_max,
      status: updatedEvent.status,
      updatedAt: updatedEvent.updated_at,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Check ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { customer_id: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this event' },
        { status: 403 }
      );
    }

    // Soft delete by setting status to CANCELLED
    await prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Unlink all quotes from this event's slots
    await prisma.quote.updateMany({
      where: {
        event_slot: {
          event_id: id,
        },
      },
      data: {
        event_slot_id: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Event cancelled' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
