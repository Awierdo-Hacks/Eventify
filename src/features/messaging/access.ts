import 'server-only';
import { db } from '@/lib/db';
import type { CurrentUser } from '@/lib/session';

/**
 * Who may open a conversation with whom:
 * - customers may contact any publicly visible provider;
 * - providers may contact customers who sent them a request or booked them;
 * - admins may contact anyone.
 * v1 allowed any signed-in user to message any user id.
 */
export async function canStartConversation(sender: CurrentUser, recipientId: string): Promise<boolean> {
  if (sender.id === recipientId) return false;
  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: {
      role: true,
      status: true,
      deleted_at: true,
      provider: { select: { id: true, verified: true, is_active: true } },
    },
  });
  if (!recipient || recipient.deleted_at || recipient.status !== 'ACTIVE') return false;
  if (sender.role === 'ADMIN') return true;

  if (sender.role === 'CUSTOMER') {
    if (recipient.role !== 'PROVIDER' || !recipient.provider) return false;
    if (recipient.provider.verified && recipient.provider.is_active) return true;
    // A hidden provider can still be reached by customers who already deal with them.
    const existing = await db.serviceRequest.count({
      where: { customer_id: sender.id, provider_id: recipient.provider.id },
    });
    return existing > 0;
  }

  if (sender.role === 'PROVIDER' && sender.providerId) {
    if (recipient.role !== 'CUSTOMER') return false;
    const existing = await db.serviceRequest.count({
      where: { customer_id: recipientId, provider_id: sender.providerId },
    });
    return existing > 0;
  }

  return false;
}

/** Find the conversation between two users, or create it. */
export async function findOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  const existing = await db.conversation.findFirst({
    where: {
      AND: [{ participants: { some: { user_id: userId } } }, { participants: { some: { user_id: otherUserId } } }],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await db.conversation.create({
    data: { participants: { create: [{ user_id: userId }, { user_id: otherUserId }] } },
    select: { id: true },
  });
  return created.id;
}
