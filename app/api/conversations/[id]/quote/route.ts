import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession, type SessionUser } from '@/lib/auth';
import { dateString } from '@/lib/validation';
import { isProviderAvailable, toDayKey } from '@/lib/availability';
import { isQuoteOpen, recomputeSlotStatus } from '@/lib/workflow';
import { formatEuro } from '@/lib/labels';

const quoteFields = {
  totalPrice: z.coerce.number().positive().max(1_000_000),
  includedServices: z.array(z.string().trim().max(200)).max(50),
  terms: z.string().trim().max(5000).nullish(),
  message: z.string().trim().min(1).max(200),
  validDays: z.coerce.number().int().min(1).max(90).optional().default(14),
  chatMessage: z.string().trim().max(2000).optional().default(''),
};

// Either answer an existing open request, or describe the event the quote is for.
// (No more placeholder dates: a booking copies these details.)
const chatQuoteSchema = z.union([
  z.object({ requestId: z.string().min(1), ...quoteFields }),
  z.object({
    requestId: z.undefined().optional(),
    eventType: z.string().trim().min(1).max(50),
    eventDate: dateString,
    eventLocation: z.string().trim().min(2).max(200),
    guestCount: z.coerce.number().int().min(1).max(100_000),
    ...quoteFields,
  }),
]);

async function loadConversationForProvider(conversationId: string, session: SessionUser) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversation_id_user_id: { conversation_id: conversationId, user_id: session.id } },
  });
  if (!participant) return null;

  const other = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: conversationId, user_id: { not: session.id } },
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
  });
  if (!other || other.user.role !== 'CUSTOMER') return null;
  return other.user;
}

// GET - Open requests between this provider and the customer (to attach a quote to)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'PROVIDER' || !session.providerId) {
    return NextResponse.json({ error: 'Alleen providers kunnen offertes versturen' }, { status: 403 });
  }

  const { id: conversationId } = await params;
  const customer = await loadConversationForProvider(conversationId, session);
  if (!customer) return NextResponse.json({ error: 'Geen toegang tot dit gesprek' }, { status: 403 });

  const requests = await prisma.serviceRequest.findMany({
    where: { customer_id: customer.id, provider_id: session.providerId, status: { in: ['PENDING', 'QUOTED'] } },
    include: { quotes: { where: { provider_id: session.providerId }, select: { accepted: true, rejected_at: true, valid_until: true } } },
    orderBy: { event_date: 'asc' },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      eventType: r.event_type,
      eventDate: r.event_date,
      eventLocation: r.event_location,
      guestCount: r.guest_count,
      hasOpenQuote: r.quotes.some((q) => isQuoteOpen(q)),
    })),
  });
}

// POST - Provider sends a quote through chat
// Creates both a Quote record AND a chat message of type QUOTE
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'PROVIDER' || !session.providerId) {
      return NextResponse.json(
        { error: 'Alleen providers kunnen offertes versturen' },
        { status: 403 }
      );
    }
    const providerId = session.providerId;

    const { id: conversationId } = await params;
    const customer = await loadConversationForProvider(conversationId, session);
    if (!customer) {
      return NextResponse.json({ error: 'Geen toegang tot dit gesprek' }, { status: 403 });
    }

    const parsed = chatQuoteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Vul prijs, beschrijving, inbegrepen diensten en de eventgegevens (datum, locatie, gasten) in' },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const includedServices = data.includedServices.filter((s) => s !== '');
    if (includedServices.length === 0) {
      return NextResponse.json({ error: 'Voeg minstens één inbegrepen dienst toe' }, { status: 400 });
    }

    // Find the request this quote answers, or create one with the real event details
    let serviceRequestId: string;
    let serviceRequestSlotId: string | null = null;

    if (!('eventDate' in data)) {
      const existing = await prisma.serviceRequest.findUnique({
        where: { id: data.requestId },
        include: { quotes: { where: { provider_id: providerId }, select: { accepted: true, rejected_at: true, valid_until: true } } },
      });
      if (
        !existing ||
        existing.provider_id !== providerId ||
        existing.customer_id !== customer.id ||
        !['PENDING', 'QUOTED'].includes(existing.status)
      ) {
        return NextResponse.json({ error: 'Aanvraag niet gevonden of al afgesloten' }, { status: 404 });
      }
      if (existing.quotes.some((q) => isQuoteOpen(q))) {
        return NextResponse.json(
          { error: 'Je hebt al een openstaande offerte voor deze aanvraag. Pas die aan via je dashboard.' },
          { status: 400 }
        );
      }
      serviceRequestId = existing.id;
      serviceRequestSlotId = existing.event_slot_id;
    } else {
      const eventDate = new Date(data.eventDate);
      if (toDayKey(eventDate) < toDayKey(new Date())) {
        return NextResponse.json({ error: 'Kies een eventdatum in de toekomst' }, { status: 400 });
      }
      if (!(await isProviderAvailable(providerId, eventDate))) {
        return NextResponse.json(
          { error: 'Je bent niet beschikbaar op deze datum volgens je agenda' },
          { status: 409 }
        );
      }
      const provider = await prisma.serviceProvider.findUniqueOrThrow({
        where: { id: providerId },
        select: { category: true },
      });
      const created = await prisma.serviceRequest.create({
        data: {
          customer_id: customer.id,
          provider_id: providerId,
          category: provider.category,
          event_type: data.eventType,
          event_date: eventDate,
          event_location: data.eventLocation,
          guest_count: data.guestCount,
          description: 'Offerte verstuurd via chat',
          status: 'PENDING',
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone || '',
        },
      });
      serviceRequestId = created.id;
    }

    const { quote, chatMsg } = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          request_id: serviceRequestId,
          provider_id: providerId,
          event_slot_id: serviceRequestSlotId,
          total_price: data.totalPrice,
          message: data.message,
          terms: data.terms || 'Standaard voorwaarden van toepassing.',
          included_services: includedServices,
          valid_until: new Date(Date.now() + data.validDays * 24 * 60 * 60 * 1000),
          accepted: false,
        },
      });

      await tx.serviceRequest.update({
        where: { id: serviceRequestId },
        data: { status: 'QUOTED' },
      });

      if (serviceRequestSlotId) await recomputeSlotStatus(tx, serviceRequestSlotId);

      // Create a QUOTE type message in the chat
      const chatMsg = await tx.message.create({
        data: {
          conversation_id: conversationId,
          sender_id: session.id,
          content: data.chatMessage || `Offerte: ${formatEuro(data.totalPrice)}`,
          message_type: 'QUOTE',
          quote_id: quote.id,
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
          quote: {
            select: {
              id: true,
              total_price: true,
              included_services: true,
              terms: true,
              message: true,
              valid_until: true,
              accepted: true,
              rejected_at: true,
              event_slot_id: true,
              provider: {
                select: { id: true, business_name: true, category: true },
              },
              request: {
                select: {
                  id: true,
                  event_type: true,
                  event_date: true,
                  booking: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
      });

      return { quote, chatMsg };
    });

    return NextResponse.json({
      message: {
        id: chatMsg.id,
        content: chatMsg.content,
        messageType: chatMsg.message_type,
        senderId: chatMsg.sender_id,
        senderName: chatMsg.sender.name,
        senderRole: chatMsg.sender.role,
        isOwn: true,
        attachments: [],
        quote: chatMsg.quote
          ? {
              id: chatMsg.quote.id,
              totalPrice: chatMsg.quote.total_price,
              includedServices: chatMsg.quote.included_services,
              terms: chatMsg.quote.terms,
              packageName: chatMsg.quote.message,
              validUntil: chatMsg.quote.valid_until,
              accepted: chatMsg.quote.accepted,
              rejected: !!chatMsg.quote.rejected_at,
              linkedToEvent: !!chatMsg.quote.event_slot_id,
              requestHasBooking: !!chatMsg.quote.request?.booking,
              provider: {
                id: chatMsg.quote.provider.id,
                businessName: chatMsg.quote.provider.business_name,
                category: chatMsg.quote.provider.category,
              },
              serviceRequest: chatMsg.quote.request
                ? {
                    id: chatMsg.quote.request.id,
                    eventType: chatMsg.quote.request.event_type,
                    eventDate: chatMsg.quote.request.event_date,
                  }
                : null,
            }
          : null,
        createdAt: chatMsg.created_at,
      },
      quote: {
        id: quote.id,
        totalPrice: quote.total_price,
      },
    });
  } catch (error) {
    console.error('Send quote via chat error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het versturen van de offerte' },
      { status: 500 }
    );
  }
}
