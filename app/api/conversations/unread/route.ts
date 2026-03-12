import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Get total unread message count for navbar badge
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all conversations the user is part of
    const participants = await prisma.conversationParticipant.findMany({
      where: { user_id: session.id },
      select: {
        conversation_id: true,
        last_read_at: true,
      },
    });

    // Count total unread messages across all conversations
    let totalUnread = 0;
    for (const participant of participants) {
      const count = await prisma.message.count({
        where: {
          conversation_id: participant.conversation_id,
          sender_id: { not: session.id },
          created_at: { gt: participant.last_read_at },
        },
      });
      totalUnread += count;
    }

    return NextResponse.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
