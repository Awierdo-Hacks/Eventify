import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { assertSlotUsable, recomputeSlotStatus, workflowErrorResponse } from '@/lib/workflow';

// POST - Link a quote (and its request) to an event slot of the same category
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

    const body = await request.json().catch(() => ({}));
    const { eventSlotId } = body as { eventSlotId?: unknown };

    if (!eventSlotId || typeof eventSlotId !== 'string') {
      return NextResponse.json(
        { error: 'Kies een onderdeel van je event' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: {
          request: { select: { id: true, customer_id: true } },
          provider: { select: { category: true } },
        },
      });

      if (!quote || quote.request.customer_id !== session.id) {
        return null;
      }

      // An accepted quote may (re)claim its slot; otherwise the slot must be free
      await assertSlotUsable(tx, {
        slotId: eventSlotId,
        customerId: session.id,
        providerCategory: quote.provider.category,
        allowBookedByQuoteId: quote.id,
      });

      const previousSlotId = quote.event_slot_id;
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { event_slot_id: eventSlotId },
      });
      await tx.serviceRequest.update({
        where: { id: quote.request.id },
        data: { event_slot_id: eventSlotId },
      });

      if (quote.accepted) {
        const booking = await tx.booking.findUnique({
          where: { request_id: quote.request.id },
          select: { status: true },
        });
        if (booking?.status === 'CONFIRMED' || booking?.status === 'COMPLETED') {
          if (previousSlotId && previousSlotId !== eventSlotId) {
            await tx.eventSlot.updateMany({
              where: { id: previousSlotId, booked_quote_id: quote.id },
              data: { booked_quote_id: null },
            });
          }
          await tx.eventSlot.update({ where: { id: eventSlotId }, data: { booked_quote_id: quote.id } });
        }
      }

      if (previousSlotId && previousSlotId !== eventSlotId) await recomputeSlotStatus(tx, previousSlotId);
      await recomputeSlotStatus(tx, eventSlotId);

      return updatedQuote;
    });

    if (!result) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      id: result.id,
      eventSlotId: result.event_slot_id,
      message: 'Offerte gekoppeld aan je event',
    });
  } catch (error) {
    const known = workflowErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    console.error('Error linking quote:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het koppelen van de offerte' },
      { status: 500 }
    );
  }
}

// DELETE - Unlink a quote from an event slot (not possible while it is booked)
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

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: { select: { id: true, customer_id: true } },
        booked_for_slot: { select: { id: true } },
      },
    });

    if (!quote || quote.request.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden' },
        { status: 404 }
      );
    }

    if (!quote.event_slot_id) {
      return NextResponse.json(
        { error: 'Deze offerte is niet gekoppeld aan een event' },
        { status: 400 }
      );
    }

    if (quote.booked_for_slot) {
      return NextResponse.json(
        { error: 'Deze offerte is geboekt. Annuleer eerst de boeking.' },
        { status: 400 }
      );
    }

    const previousSlotId = quote.event_slot_id;

    await prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id: quoteId }, data: { event_slot_id: null } });
      await tx.serviceRequest.updateMany({
        where: { id: quote.request.id, event_slot_id: previousSlotId },
        data: { event_slot_id: null },
      });
      await recomputeSlotStatus(tx, previousSlotId);
    });

    return NextResponse.json({
      id: quoteId,
      eventSlotId: null,
      message: 'Offerte losgekoppeld van het event',
    });
  } catch (error) {
    console.error('Error unlinking quote:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het loskoppelen van de offerte' },
      { status: 500 }
    );
  }
}
