import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { parseBody, dateString } from '@/lib/validation';
import {
  acceptQuote,
  rejectQuote,
  isQuoteOpen,
  postSystemMessage,
  recomputeSlotStatus,
  workflowErrorResponse,
} from '@/lib/workflow';
import { formatEuro } from '@/lib/labels';

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('accept'), eventSlotId: z.string().min(1).nullish() }),
  z.object({ action: z.literal('reject'), reason: z.string().max(500).nullish() }),
  z.object({
    action: z.literal('update'),
    totalPrice: z.number().positive().max(1_000_000).optional(),
    packageName: z.string().trim().max(200).optional(),
    terms: z.string().trim().max(5000).nullish(),
    includedServices: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
    validUntil: dateString.optional(),
  }),
]);

// PATCH - Customer accepts/rejects a quote; provider updates an open quote
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

    const { id: quoteId } = await params;
    const { data, error } = await parseBody(request, patchSchema);
    if (error) return error;

    if (data.action === 'accept') {
      const result = await acceptQuote({ quoteId, customer: session, eventSlotId: data.eventSlotId });
      return NextResponse.json({
        success: true,
        message: result.alreadyAccepted ? 'Offerte is al geaccepteerd' : 'Offerte geaccepteerd en boeking aangemaakt',
        quote: { id: result.quote.id, accepted: true },
        booking: {
          id: result.booking.id,
          eventDate: result.booking.event_date,
          status: result.booking.status,
        },
      });
    }

    if (data.action === 'reject') {
      const updatedQuote = await rejectQuote({ quoteId, customer: session, reason: data.reason });
      return NextResponse.json({
        success: true,
        message: 'Offerte afgewezen',
        quote: { id: updatedQuote.id, accepted: false, rejectedAt: updatedQuote.rejected_at },
      });
    }

    // update: only the provider, only while the quote is still open
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { request: { select: { customer_id: true, status: true } } },
    });

    if (!quote || !session.providerId || quote.provider_id !== session.providerId) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }
    if (!isQuoteOpen(quote) || !['PENDING', 'QUOTED'].includes(quote.request.status)) {
      return NextResponse.json(
        { error: 'Alleen openstaande offertes kunnen aangepast worden' },
        { status: 400 }
      );
    }
    if (data.validUntil && new Date(data.validUntil) < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: 'De geldigheidsdatum ligt in het verleden' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.quote.update({
        where: { id: quote.id },
        data: {
          ...(data.totalPrice !== undefined ? { total_price: data.totalPrice } : {}),
          ...(data.packageName !== undefined ? { message: data.packageName || null } : {}),
          ...(data.terms !== undefined ? { terms: data.terms || null } : {}),
          ...(data.includedServices !== undefined ? { included_services: data.includedServices } : {}),
          ...(data.validUntil !== undefined ? { valid_until: new Date(data.validUntil) } : {}),
        },
      });
      await postSystemMessage(
        tx,
        session.id,
        quote.request.customer_id,
        `✏️ De offerte is aangepast: ${formatEuro(result.total_price)}, geldig tot ${result.valid_until.toLocaleDateString('nl-BE')}.`
      );
      return result;
    });

    return NextResponse.json({ success: true, quote: { id: updated.id } });
  } catch (error) {
    const known = workflowErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    console.error('Quote action error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het verwerken van de offerte' },
      { status: 500 }
    );
  }
}

// DELETE - Provider withdraws an open quote or removes a rejected one
export async function DELETE(
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

    if (session.role !== 'PROVIDER' || !session.providerId) {
      return NextResponse.json(
        { error: 'Forbidden - only providers can withdraw quotes' },
        { status: 403 }
      );
    }

    const { id: quoteId } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { request: { select: { id: true, customer_id: true, status: true } } },
    });

    if (!quote || quote.provider_id !== session.providerId) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden' },
        { status: 404 }
      );
    }

    if (quote.accepted) {
      return NextResponse.json(
        { error: 'Een geaccepteerde offerte kan niet ingetrokken worden. Annuleer de boeking.' },
        { status: 400 }
      );
    }

    const wasOpen = !quote.rejected_at;

    await prisma.$transaction(async (tx) => {
      await tx.quote.delete({ where: { id: quoteId } });

      // Request goes back to "new" when the provider has no other quotes on it
      if (quote.request.status === 'QUOTED') {
        const remaining = await tx.quote.count({
          where: { request_id: quote.request.id, rejected_at: null },
        });
        if (remaining === 0) {
          await tx.serviceRequest.update({ where: { id: quote.request.id }, data: { status: 'PENDING' } });
        }
      }

      if (quote.event_slot_id) await recomputeSlotStatus(tx, quote.event_slot_id);

      if (wasOpen) {
        await postSystemMessage(tx, session.id, quote.request.customer_id, 'De provider heeft de offerte ingetrokken.');
      }
    });

    return NextResponse.json({
      success: true,
      message: wasOpen ? 'Offerte ingetrokken' : 'Offerte verwijderd',
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het intrekken van de offerte' },
      { status: 500 }
    );
  }
}
