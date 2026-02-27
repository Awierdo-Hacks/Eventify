import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ProviderCategory } from '@/lib/eventHelpers';

// GET - List slots for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: eventId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Check event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { customer_id: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this event' },
        { status: 403 }
      );
    }

    const slots = await prisma.eventSlot.findMany({
      where: { event_id: eventId },
      include: {
        quotes: {
          select: {
            id: true,
            total_price: true,
            accepted: true,
            provider: {
              select: {
                id: true,
                business_name: true,
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
              },
            },
          },
        },
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    const formattedSlots = slots.map((slot: any) => ({
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
          }
        : null,
      quotes: slot.quotes.map((q: any) => ({
        id: q.id,
        totalPrice: q.total_price,
        accepted: q.accepted,
        providerName: q.provider.business_name,
      })),
    }));

    return NextResponse.json({ slots: formattedSlots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}

// POST - Add a slot to an event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: eventId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Check event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          select: { display_order: true },
          orderBy: { display_order: 'desc' },
          take: 1,
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, customName, isRequired } = body;

    // Validate category
    const validCategories: ProviderCategory[] = [
      'CATERING', 'MUSIC', 'PHOTOGRAPHY', 'DECORATION', 'VENUE',
      'ENTERTAINMENT', 'VIDEOGRAPHY', 'TRANSPORT', 'ACCOMMODATION',
      'SECURITY', 'SANITARY', 'CAKE', 'FLOWERS', 'MC', 'OTHER'
    ];

    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Valid category is required' },
        { status: 400 }
      );
    }

    // Calculate next display order
    const maxOrder = event.slots[0]?.display_order ?? -1;

    const slot = await prisma.eventSlot.create({
      data: {
        event_id: eventId,
        category: category as ProviderCategory,
        custom_name: customName?.trim() || null,
        is_required: isRequired ?? false,
        display_order: maxOrder + 1,
        status: 'EMPTY',
      },
    });

    return NextResponse.json({
      id: slot.id,
      category: slot.category,
      customName: slot.custom_name,
      isRequired: slot.is_required,
      displayOrder: slot.display_order,
      status: slot.status,
      quotesCount: 0,
      bookedQuote: null,
      quotes: [],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json(
      { error: 'Failed to create slot' },
      { status: 500 }
    );
  }
}
