import 'server-only';
import { db } from '@/lib/db';

/** Total unread messages for a user across all conversations (one indexed query). */
export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count
    FROM messages m
    INNER JOIN conversation_participants cp
      ON cp.conversation_id = m.conversation_id AND cp.user_id = ${userId}
    WHERE m.sender_id <> ${userId} AND m.created_at > cp.last_read_at
  `;
  return Number(rows[0]?.count ?? 0);
}
