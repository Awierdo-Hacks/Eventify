import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List conversations for current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { user_id: session.id },
        },
      },
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
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true },
            },
            attachments: {
              select: { id: true, file_type: true },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    // Calculate unread counts and format
    const formatted = conversations.map((conv) => {
      const myParticipant = conv.participants.find((p) => p.user_id === session.id);
      const otherParticipant = conv.participants.find((p) => p.user_id !== session.id);
      const lastMessage = conv.messages[0] || null;

      // Count unread messages (sent after my last_read_at, not sent by me)
      const lastReadAt = myParticipant?.last_read_at || new Date(0);

      return {
        id: conv.id,
        updatedAt: conv.updated_at,
        otherUser: otherParticipant
          ? {
              id: otherParticipant.user.id,
              name: otherParticipant.user.name,
              role: otherParticipant.user.role,
              businessName: otherParticipant.user.provider?.business_name || null,
              category: otherParticipant.user.provider?.category || null,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              messageType: lastMessage.message_type,
              senderId: lastMessage.sender_id,
              senderName: lastMessage.sender.name,
              hasAttachment: lastMessage.attachments.length > 0,
              createdAt: lastMessage.created_at,
            }
          : null,
        lastReadAt,
      };
    });

    // Now get unread counts in a separate query for accuracy
    const unreadCounts = await Promise.all(
      formatted.map(async (conv) => {
        const count = await prisma.message.count({
          where: {
            conversation_id: conv.id,
            sender_id: { not: session.id },
            created_at: { gt: conv.lastReadAt },
          },
        });
        return { id: conv.id, unreadCount: count };
      })
    );

    const conversationsWithUnread = formatted.map((conv) => {
      const unread = unreadCounts.find((u) => u.id === conv.id);
      return {
        ...conv,
        unreadCount: unread?.unreadCount || 0,
      };
    });

    return NextResponse.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van gesprekken' },
      { status: 500 }
    );
  }
}

// POST - Create or get existing conversation between two users
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId is verplicht' }, { status: 400 });
    }

    if (recipientId === session.id) {
      return NextResponse.json({ error: 'Je kunt geen gesprek met jezelf starten' }, { status: 400 });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Check if conversation already exists between these two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { user_id: session.id } } },
          { participants: { some: { user_id: recipientId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        conversation: { id: existingConversation.id },
        isNew: false,
      });
    }

    // Create new conversation with both participants
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { user_id: session.id },
            { user_id: recipientId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      conversation: { id: conversation.id },
      isNew: true,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het aanmaken van het gesprek' },
      { status: 500 }
    );
  }
}
