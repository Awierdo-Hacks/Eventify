'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { rateLimit, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import { formatPrice } from '@/lib/format';
import {
  getThread,
  isParticipant,
  markConversationRead,
  messageSelect,
  toMessageView,
  type MessageView,
} from '@/features/messaging/queries';
import { chatQuoteSchema, DEFAULT_TERMS, type ChatQuoteInput } from '@/features/quotes/schemas';

const NOT_SIGNED_IN = 'Je bent niet meer ingelogd. Log opnieuw in.';
const NO_ACCESS = 'Je hebt geen toegang tot dit gesprek.';
const DAY_MS = 24 * 60 * 60 * 1000;

const attachmentSchema = z.object({
  // Only files that went through our own upload action.
  url: z.string().max(500).refine((url) => url.startsWith('/uploads/chat/') || /^https:\/\/[\w.-]+\.blob\.vercel-storage\.com\//.test(url)),
  fileName: z.string().max(200),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  fileSize: z.number().int().min(1).max(12 * 1024 * 1024),
});

const sendSchema = z
  .object({
    conversationId: z.string().min(1),
    content: z.string().trim().max(4000, 'Je bericht is te lang (maximaal 4000 tekens).'),
    attachments: z.array(attachmentSchema).max(5, 'Maximaal 5 bijlagen per bericht.').default([]),
  })
  .refine((data) => data.content.length > 0 || data.attachments.length > 0, { message: 'Typ een bericht of voeg een bijlage toe.' });

export type SendMessageInput = z.input<typeof sendSchema>;

export async function sendMessageAction(input: SendMessageInput): Promise<ActionResult<MessageView>> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? GENERIC_ERROR);
  const data = parsed.data;

  if (!rateLimit(`message:${user.id}`, 60, 60_000).allowed) return fail(TOO_MANY_REQUESTS);

  try {
    if (!(await isParticipant(user.id, data.conversationId))) return fail(NO_ACCESS);
    const now = new Date();
    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversation_id: data.conversationId,
          sender_id: user.id,
          content: data.content,
          message_type: !data.content && data.attachments.every((file) => file.fileType.startsWith('image/')) ? 'IMAGE' : 'TEXT',
          attachments: {
            create: data.attachments.map((file) => ({
              url: file.url,
              file_name: file.fileName,
              file_type: file.fileType,
              file_size: file.fileSize,
            })),
          },
        },
        select: messageSelect,
      }),
      db.conversation.update({ where: { id: data.conversationId }, data: { updated_at: now } }),
      db.conversationParticipant.updateMany({
        where: { conversation_id: data.conversationId, user_id: user.id },
        data: { last_read_at: now },
      }),
    ]);
    return ok(toMessageView(message));
  } catch (error) {
    console.error('[messaging] send failed', error);
    return fail(GENERIC_ERROR);
  }
}

/** Provider sends a quote inside a conversation: creates the quote and a quote message. */
export async function sendChatQuoteAction(input: ChatQuoteInput): Promise<ActionResult<MessageView>> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  if (user.role !== 'PROVIDER' || !user.providerId) return fail('Alleen dienstverleners kunnen offertes versturen.');
  const providerId = user.providerId;

  const parsed = chatQuoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  if (!rateLimit(`chat-quote:${user.id}`, 20, 60 * 60_000).allowed) return fail(TOO_MANY_REQUESTS);

  try {
    const [provider, other] = await Promise.all([
      db.serviceProvider.findUnique({ where: { id: providerId }, select: { category: true } }),
      db.conversationParticipant.findFirst({
        where: { conversation_id: data.conversationId, user_id: { not: user.id }, conversation: { participants: { some: { user_id: user.id } } } },
        select: { user: { select: { id: true, name: true, email: true, phone: true, role: true, status: true, deleted_at: true } } },
      }),
    ]);
    if (!other || !provider) return fail(NO_ACCESS);
    const customer = other.user;
    if (customer.role !== 'CUSTOMER' || customer.deleted_at || customer.status !== 'ACTIVE') {
      return fail('Je kunt alleen offertes sturen naar klanten met een actief account.');
    }

    const eventDate = data.eventDate && !Number.isNaN(new Date(data.eventDate).getTime()) ? new Date(`${data.eventDate}T00:00:00.000Z`) : null;

    const message = await db.$transaction(async (tx) => {
      // Reuse the open request between these two, or open one for this quote.
      let request = await tx.serviceRequest.findFirst({
        where: { customer_id: customer.id, provider_id: providerId, status: { in: ['PENDING', 'QUOTED'] } },
        orderBy: { created_at: 'desc' },
        select: { id: true },
      });
      if (!request) {
        request = await tx.serviceRequest.create({
          data: {
            customer_id: customer.id,
            provider_id: providerId,
            category: provider.category,
            event_type: 'Anders',
            // Chat quotes may not have a date yet; v1 used the same placeholder.
            event_date: eventDate ?? new Date(Date.now() + 30 * DAY_MS),
            event_location: data.eventLocation || 'Nader te bepalen',
            guest_count: 0,
            description: 'Offerte verstuurd via een gesprek',
            status: 'QUOTED',
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone ?? '',
          },
          select: { id: true },
        });
      } else {
        await tx.serviceRequest.update({
          where: { id: request.id },
          data: {
            status: 'QUOTED',
            ...(eventDate ? { event_date: eventDate } : {}),
            ...(data.eventLocation ? { event_location: data.eventLocation } : {}),
          },
        });
      }

      const quote = await tx.quote.create({
        data: {
          request_id: request.id,
          provider_id: providerId,
          total_price: data.totalPrice,
          message: data.title,
          terms: data.terms || DEFAULT_TERMS,
          included_services: data.includedServices,
          valid_until: new Date(Date.now() + data.validDays * DAY_MS),
        },
        select: { id: true },
      });

      const now = new Date();
      const created = await tx.message.create({
        data: {
          conversation_id: data.conversationId,
          sender_id: user.id,
          content: `Offerte: ${formatPrice(data.totalPrice)}`,
          message_type: 'QUOTE',
          quote_id: quote.id,
        },
        select: messageSelect,
      });
      await tx.conversation.update({ where: { id: data.conversationId }, data: { updated_at: now } });
      await tx.conversationParticipant.updateMany({
        where: { conversation_id: data.conversationId, user_id: user.id },
        data: { last_read_at: now },
      });
      return created;
    });

    revalidateApp();
    return ok(toMessageView(message), 'Offerte verstuurd.');
  } catch (error) {
    console.error('[messaging] chat quote failed', error);
    return fail(GENERIC_ERROR);
  }
}

/** Older messages for "load earlier". */
export async function loadEarlierAction(input: { conversationId: string; before: string }): Promise<ActionResult<{ messages: MessageView[]; hasMore: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  try {
    const thread = await getThread(user.id, input.conversationId, input.before);
    if (!thread) return fail(NO_ACCESS);
    return ok({ messages: thread.messages, hasMore: thread.hasMore });
  } catch (error) {
    console.error('[messaging] load earlier failed', error);
    return fail(GENERIC_ERROR);
  }
}

export async function markReadAction(input: { conversationId: string }): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await markConversationRead(user.id, input.conversationId).catch(() => undefined);
}
