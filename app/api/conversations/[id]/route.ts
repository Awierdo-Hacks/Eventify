import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Get conversation details with other participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                first_name: true,
                last_name: true,
                role: true,
                provider: {
                  select: {
                    id: true,
                    business_name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Gesprek niet gevonden' }, { status: 404 });
    }

    // Get messages with pagination (newest first for cursor, but return oldest first)
    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        ...(cursor ? { created_at: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        attachments: true,
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
              select: {
                id: true,
                business_name: true,
                category: true,
              },
            },
            request: {
              select: {
                id: true,
                event_type: true,
                event_date: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    // Mark messages as read
    await prisma.conversationParticipant.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: session.id,
        },
      },
      data: { last_read_at: new Date() },
    });

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== session.id
    );

    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      messageType: msg.message_type,
      senderId: msg.sender_id,
      senderName: msg.sender.name,
      senderRole: msg.sender.role,
      isOwn: msg.sender_id === session.id,
      attachments: msg.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        fileName: a.file_name,
        fileType: a.file_type,
        fileSize: a.file_size,
      })),
      quote: msg.quote
        ? {
            id: msg.quote.id,
            totalPrice: msg.quote.total_price,
            includedServices: msg.quote.included_services,
            terms: msg.quote.terms,
            packageName: msg.quote.message,
            validUntil: msg.quote.valid_until,
            accepted: msg.quote.accepted,
            rejected: !!msg.quote.rejected_at,
            linkedToEvent: !!msg.quote.event_slot_id,
            provider: {
              id: msg.quote.provider.id,
              businessName: msg.quote.provider.business_name,
              category: msg.quote.provider.category,
            },
            serviceRequest: msg.quote.request
              ? {
                  id: msg.quote.request.id,
                  eventType: msg.quote.request.event_type,
                  eventDate: msg.quote.request.event_date,
                }
              : null,
          }
        : null,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: otherParticipant
          ? {
              id: otherParticipant.user.id,
              name: otherParticipant.user.name,
              role: otherParticipant.user.role,
              businessName: otherParticipant.user.provider?.business_name || null,
              category: otherParticipant.user.provider?.category || null,
            }
          : null,
      },
      messages: formattedMessages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Conversation messages error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van berichten' },
      { status: 500 }
    );
  }
}

// POST - Send a message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const body = await request.json();
    const { content, messageType = 'TEXT', attachments = [], quoteId } = body;

    if (!content && attachments.length === 0) {
      return NextResponse.json({ error: 'Bericht of bijlage is verplicht' }, { status: 400 });
    }

    // If quoteId provided, verify it exists and user has access
    if (quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { provider: true, request: true },
      });

      if (!quote) {
        return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
      }

      // Only the provider who made the quote or the customer can share it
      const isProvider = quote.provider.user_id === session.id;
      const isCustomer = quote.request.customer_id === session.id;
      if (!isProvider && !isCustomer) {
        return NextResponse.json({ error: 'Geen toegang tot deze offerte' }, { status: 403 });
      }
    }

    // Create message with attachments
    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: session.id,
        content: content || '',
        message_type: messageType as any,
        quote_id: quoteId || null,
        attachments: {
          create: attachments.map((a: { url: string; fileName: string; fileType: string; fileSize: number }) => ({
            url: a.url,
            file_name: a.fileName,
            file_type: a.fileType,
            file_size: a.fileSize,
          })),
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        attachments: true,
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
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    // Update sender's last_read_at
    await prisma.conversationParticipant.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: session.id,
        },
      },
      data: { last_read_at: new Date() },
    });

    const formatted = {
      id: message.id,
      content: message.content,
      messageType: message.message_type,
      senderId: message.sender_id,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      isOwn: true,
      attachments: message.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        fileName: a.file_name,
        fileType: a.file_type,
        fileSize: a.file_size,
      })),
      quote: message.quote
        ? {
            id: message.quote.id,
            totalPrice: message.quote.total_price,
            includedServices: message.quote.included_services,
            terms: message.quote.terms,
            packageName: message.quote.message,
            validUntil: message.quote.valid_until,
            accepted: message.quote.accepted,
            rejected: !!message.quote.rejected_at,
            linkedToEvent: !!message.quote.event_slot_id,
            provider: {
              id: message.quote.provider.id,
              businessName: message.quote.provider.business_name,
              category: message.quote.provider.category,
            },
          }
        : null,
      createdAt: message.created_at,
    };

    return NextResponse.json({ message: formatted });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het versturen van het bericht' },
      { status: 500 }
    );
  }
}
