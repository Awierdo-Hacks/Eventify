import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

    const { id: conversationId } = await params;

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: session.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Geen toegang tot dit gesprek' }, { status: 403 });
    }

    // Get the other participant (customer)
    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: { not: session.id },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!otherParticipant) {
      return NextResponse.json({ error: 'Geen gesprekspartner gevonden' }, { status: 400 });
    }

    const body = await request.json();
    const {
      totalPrice,
      includedServices,
      terms,
      message,
      validDays = 14,
      eventType = 'CUSTOM',
      chatMessage = '',
    } = body;

    // Validate
    if (!totalPrice || !includedServices || includedServices.length === 0 || !message) {
      return NextResponse.json(
        { error: 'Prijs, inbegrepen diensten en beschrijving zijn verplicht' },
        { status: 400 }
      );
    }

    // First, find or create a ServiceRequest for this customer-provider pair
    let serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        customer_id: otherParticipant.user.id,
        provider_id: session.providerId,
        status: { in: ['PENDING', 'QUOTED'] },
      },
    });

    if (!serviceRequest) {
      // Create a service request automatically for chat-initiated quotes
      serviceRequest = await prisma.serviceRequest.create({
        data: {
          customer_id: otherParticipant.user.id,
          provider_id: session.providerId,
          category: 'Via Chat',
          event_type: eventType,
          event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now placeholder
          event_location: 'Nader te bepalen',
          guest_count: 0,
          description: `Offerte verstuurd via chat gesprek`,
          status: 'QUOTED',
          customer_name: otherParticipant.user.name,
          customer_email: otherParticipant.user.email,
          customer_phone: otherParticipant.user.phone || '',
        },
      });
    }

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        request_id: serviceRequest.id,
        provider_id: session.providerId,
        total_price: parseFloat(totalPrice),
        message,
        terms: terms || 'Standaard voorwaarden van toepassing.',
        included_services: includedServices.filter((s: string) => s.trim() !== ''),
        valid_until: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        accepted: false,
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: serviceRequest.id },
      data: { status: 'QUOTED' },
    });

    // Create a QUOTE type message in the chat
    const chatMsg = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: session.id,
        content: chatMessage || `Offerte: €${parseFloat(totalPrice).toLocaleString('nl-NL')}`,
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
              select: { id: true, event_type: true, event_date: true },
            },
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
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
