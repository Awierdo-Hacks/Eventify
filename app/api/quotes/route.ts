import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getQuotesForSession } from '@/lib/page-data';
import { z } from 'zod';
import { parseBody, dateString } from '@/lib/validation';
import { toDayKey } from '@/lib/availability';
import { isRequestOpen, postSystemMessage, recomputeSlotStatus } from '@/lib/workflow';
import { formatEuro } from '@/lib/labels';

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
    // Same data shape as the server-rendered dashboards (lib/page-data.ts)
    const quotes = await getQuotesForSession(session, { requestId: searchParams.get('requestId'), status: searchParams.get('status') });

    return NextResponse.json({
      quotes,
      total: quotes.length,
    });
  } catch (error) {
    console.error('quotes API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van offertes' },
      { status: 500 }
    );
  }
}

const createQuoteSchema = z.object({
  requestId: z.string().min(1),
  totalPrice: z.coerce.number().positive().max(1_000_000),
  message: z.string().trim().min(1).max(200),
  terms: z.string().trim().max(5000).nullish(),
  includedServices: z.array(z.string().trim().max(200)).max(50),
  validUntil: dateString.nullish(),
});

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
    const providerId = session.providerId;

    const { data, error } = await parseBody(request, createQuoteSchema);
    if (error) return error;

    const includedServices = data.includedServices.filter((s) => s !== '');
    if (includedServices.length === 0) {
      return NextResponse.json({ error: 'Voeg minstens één inbegrepen dienst toe' }, { status: 400 });
    }

    const validUntil = data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    if (toDayKey(validUntil) < toDayKey(new Date())) {
      return NextResponse.json({ error: 'De geldigheidsdatum ligt in het verleden' }, { status: 400 });
    }

    // Verify the service request exists and is for this provider
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!serviceRequest || serviceRequest.provider_id !== providerId) {
      return NextResponse.json(
        { error: 'Aanvraag niet gevonden' },
        { status: 404 }
      );
    }

    if (!isRequestOpen(serviceRequest)) {
      return NextResponse.json(
        { error: 'Deze aanvraag is afgesloten. Je kunt er geen offerte meer voor sturen.' },
        { status: 400 }
      );
    }

    // Only one open quote per provider per request
    const existingQuote = await prisma.quote.findFirst({
      where: {
        request_id: data.requestId,
        provider_id: providerId,
        rejected_at: null,
      },
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: 'Je hebt al een openstaande offerte voor deze aanvraag. Pas die aan of trek ze eerst in.' },
        { status: 400 }
      );
    }

    const quote = await prisma.$transaction(async (tx) => {
      // A rejected earlier quote is replaced by the new one
      await tx.quote.deleteMany({
        where: { request_id: data.requestId, provider_id: providerId, rejected_at: { not: null }, accepted: false },
      });

      const created = await tx.quote.create({
        data: {
          request_id: data.requestId,
          provider_id: providerId,
          // Requests made for an event slot link their quote to that slot automatically
          event_slot_id: serviceRequest.event_slot_id,
          total_price: data.totalPrice,
          message: data.message,
          terms: data.terms || 'Standaard voorwaarden van toepassing.',
          included_services: includedServices,
          valid_until: validUntil,
          accepted: false,
        },
      });

      await tx.serviceRequest.update({
        where: { id: data.requestId },
        data: { status: 'QUOTED' },
      });

      if (created.event_slot_id) await recomputeSlotStatus(tx, created.event_slot_id);

      await postSystemMessage(
        tx,
        session.id,
        serviceRequest.customer_id,
        `💶 Nieuwe offerte: ${data.message} voor ${formatEuro(data.totalPrice)}, geldig tot ${validUntil.toLocaleDateString('nl-BE')}. Bekijk en vergelijk ze in je dashboard onder Offertes.`
      );

      return created;
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
