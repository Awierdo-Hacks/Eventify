import 'server-only';
import { db } from '@/lib/db';
import { quoteSelect, toQuoteView, type QuoteView } from '@/features/quotes/queries';
import type { Prisma } from '@/generated/prisma/client';

export const THREAD_PAGE_SIZE = 40;

const messageSelect = {
  id: true,
  content: true,
  message_type: true,
  sender_id: true,
  created_at: true,
  attachments: { select: { id: true, url: true, file_name: true, file_type: true, file_size: true } },
  quote: { select: quoteSelect },
} satisfies Prisma.MessageSelect;

type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

export interface MessageView {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'QUOTE' | 'SYSTEM';
  senderId: string;
  createdAt: string;
  attachments: Array<{ id: string; url: string; fileName: string; fileType: string; fileSize: number }>;
  quote: QuoteView | null;
}

export function toMessageView(row: MessageRow): MessageView {
  return {
    id: row.id,
    content: row.content,
    type: row.message_type,
    senderId: row.sender_id,
    createdAt: row.created_at.toISOString(),
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      url: attachment.url,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      fileSize: attachment.file_size,
    })),
    quote: row.quote ? toQuoteView(row.quote) : null,
  };
}

export { messageSelect };

export interface ConversationSummary {
  id: string;
  updatedAt: string;
  unread: number;
  other: { id: string; name: string; subtitle: string | null; image: string | null } | null;
  lastMessage: { preview: string; createdAt: string; own: boolean } | null;
}

function preview(message: { content: string; message_type: string; attachments: unknown[] }): string {
  if (message.message_type === 'QUOTE') return 'Offerte';
  if (!message.content && message.attachments.length > 0) return 'Bijlage';
  return message.content.slice(0, 120);
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const [conversations, unreadRows] = await Promise.all([
    db.conversation.findMany({
      where: { participants: { some: { user_id: userId } } },
      select: {
        id: true,
        updated_at: true,
        participants: {
          where: { user_id: { not: userId } },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                deleted_at: true,
                provider: { select: { business_name: true, images: true } },
              },
            },
          },
          take: 1,
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { content: true, message_type: true, sender_id: true, created_at: true, attachments: { select: { id: true } } },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 100,
    }),
    db.$queryRaw<Array<{ conversation_id: string; count: bigint }>>`
      SELECT m.conversation_id, COUNT(*) AS count
      FROM messages m
      INNER JOIN conversation_participants cp
        ON cp.conversation_id = m.conversation_id AND cp.user_id = ${userId}
      WHERE m.sender_id <> ${userId} AND m.created_at > cp.last_read_at
      GROUP BY m.conversation_id
    `,
  ]);
  const unread = new Map(unreadRows.map((row) => [row.conversation_id, Number(row.count)]));

  return conversations.map((conversation) => {
    const other = conversation.participants[0]?.user;
    const last = conversation.messages[0];
    return {
      id: conversation.id,
      updatedAt: conversation.updated_at.toISOString(),
      unread: unread.get(conversation.id) ?? 0,
      other: other
        ? {
            id: other.id,
            name: other.deleted_at ? 'Verwijderde gebruiker' : (other.provider?.business_name ?? other.name),
            subtitle: other.provider && !other.deleted_at && other.name !== other.provider.business_name ? other.name : null,
            image: other.provider?.images[0] ?? null,
          }
        : null,
      lastMessage: last ? { preview: preview(last), createdAt: last.created_at.toISOString(), own: last.sender_id === userId } : null,
    };
  });
}

export async function isParticipant(userId: string, conversationId: string): Promise<boolean> {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    select: { id: true },
  });
  return Boolean(participant);
}

export async function markConversationRead(userId: string, conversationId: string) {
  await db.conversationParticipant.updateMany({
    where: { conversation_id: conversationId, user_id: userId },
    data: { last_read_at: new Date() },
  });
}

/** One page of a conversation (oldest first) plus who the other person is. */
export async function getThread(userId: string, conversationId: string, before?: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, participants: { some: { user_id: userId } } },
    select: {
      id: true,
      participants: {
        where: { user_id: { not: userId } },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              status: true,
              deleted_at: true,
              provider: { select: { id: true, business_name: true, category: true, images: true } },
            },
          },
        },
        take: 1,
      },
    },
  });
  if (!conversation) return null;

  const rows = await db.message.findMany({
    where: { conversation_id: conversationId, ...(before ? { created_at: { lt: new Date(before) } } : {}) },
    select: messageSelect,
    orderBy: { created_at: 'desc' },
    take: THREAD_PAGE_SIZE + 1,
  });
  const hasMore = rows.length > THREAD_PAGE_SIZE;
  const messages = rows.slice(0, THREAD_PAGE_SIZE).reverse().map(toMessageView);

  const other = conversation.participants[0]?.user ?? null;
  return {
    id: conversation.id,
    messages,
    hasMore,
    other: other
      ? {
          id: other.id,
          name: other.deleted_at ? 'Verwijderde gebruiker' : (other.provider?.business_name ?? other.name),
          contactName: other.provider && !other.deleted_at && other.name !== other.provider.business_name ? other.name : null,
          role: other.role as string,
          providerId: other.provider?.id ?? null,
          image: other.provider?.images[0] ?? null,
          available: !other.deleted_at && other.status === 'ACTIVE',
        }
      : null,
  };
}

export type Thread = NonNullable<Awaited<ReturnType<typeof getThread>>>;

export async function getMessagesAfter(conversationId: string, after: string): Promise<MessageView[]> {
  const date = new Date(after);
  if (Number.isNaN(date.getTime())) return [];
  const rows = await db.message.findMany({
    where: { conversation_id: conversationId, created_at: { gt: date } },
    select: messageSelect,
    orderBy: { created_at: 'asc' },
    take: 100,
  });
  return rows.map(toMessageView);
}
