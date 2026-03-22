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

    // Count all unread messages across all conversations in a single query
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM messages m
      INNER JOIN conversation_participants cp
        ON cp.conversation_id = m.conversation_id
        AND cp.user_id = ${session.id}
      WHERE m.sender_id != ${session.id}
        AND m.created_at > cp.last_read_at
    `;

    const totalUnread = Number(result[0]?.count ?? 0);
    return NextResponse.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
