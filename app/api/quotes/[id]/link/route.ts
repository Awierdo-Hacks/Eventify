import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST - Link a quote to an event slot
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: quoteId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventSlotId } = body;

    if (!eventSlotId) {
      return NextResponse.json(
        { error: 'Event slot ID is required' },
        { status: 400 }
      );
    }

    // Get the quote with its request to verify ownership
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          select: {
            customer_id: true,
          },
        },
        provider: {
          select: {
            category: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Verify the customer owns this quote's request
    if (quote.request.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to link this quote' },
        { status: 403 }
      );
    }

    // Get the slot to verify ownership and category match
    const slot = await prisma.eventSlot.findUnique({
      where: { id: eventSlotId },
      include: {
        event: {
          select: {
            customer_id: true,
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Event slot not found' },
        { status: 404 }
      );
    }

    // Verify the customer owns this event
    if (slot.event.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this event' },
        { status: 403 }
      );
    }

    // Update the quote with the slot link
    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        event_slot_id: eventSlotId,
      },
      include: {
        provider: {
          select: {
            business_name: true,
          },
        },
      },
    });

    // Update the slot status if needed
    const slotQuotesCount = await prisma.quote.count({
      where: { event_slot_id: eventSlotId },
    });

    if (slotQuotesCount > 0 && slot.status === 'EMPTY') {
      await prisma.eventSlot.update({
        where: { id: eventSlotId },
        data: { status: 'QUOTES_RECEIVED' },
      });
    }

    return NextResponse.json({
      id: updatedQuote.id,
      eventSlotId: updatedQuote.event_slot_id,
      message: `Quote linked to event slot`,
    });
  } catch (error) {
    console.error('Error linking quote:', error);
    return NextResponse.json(
      { error: 'Failed to link quote' },
      { status: 500 }
    );
  }
}

// DELETE - Unlink a quote from an event slot
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: quoteId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Get the quote with its request to verify ownership
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          select: {
            customer_id: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Verify the customer owns this quote's request
    if (quote.request.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to unlink this quote' },
        { status: 403 }
      );
    }

    if (!quote.event_slot_id) {
      return NextResponse.json(
        { error: 'Quote is not linked to any event slot' },
        { status: 400 }
      );
    }

    const previousSlotId = quote.event_slot_id;

    // Unlink the quote
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        event_slot_id: null,
      },
    });

    // Check if slot still has quotes and update status accordingly
    const remainingQuotes = await prisma.quote.count({
      where: { event_slot_id: previousSlotId },
    });

    if (remainingQuotes === 0) {
      await prisma.eventSlot.update({
        where: { id: previousSlotId },
        data: { status: 'EMPTY' },
      });
    }

    return NextResponse.json({
      id: quoteId,
      eventSlotId: null,
      message: 'Quote unlinked from event slot',
    });
  } catch (error) {
    console.error('Error unlinking quote:', error);
    return NextResponse.json(
      { error: 'Failed to unlink quote' },
      { status: 500 }
    );
  }
}
