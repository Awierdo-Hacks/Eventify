import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// SSE endpoint for real-time message updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
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
    return new Response('Forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  let lastCheckTime = new Date();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'));

      const poll = async () => {
        if (closed) return;

        try {
          // Check for new messages since last check
          const newMessages = await prisma.message.findMany({
            where: {
              conversation_id: conversationId,
              created_at: { gt: lastCheckTime },
              sender_id: { not: session.id }, // Only other user's messages
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
                  request: {
                    select: {
                      booking: { select: { id: true } },
                    },
                  },
                },
              },
            },
            orderBy: { created_at: 'asc' },
          });

          if (newMessages.length > 0) {
            lastCheckTime = newMessages[newMessages.length - 1].created_at;

            for (const msg of newMessages) {
              const formatted = {
                id: msg.id,
                content: msg.content,
                messageType: msg.message_type,
                senderId: msg.sender_id,
                senderName: msg.sender.name,
                senderRole: msg.sender.role,
                isOwn: false,
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
                      requestHasBooking: !!msg.quote.request?.booking,
                      provider: {
                        id: msg.quote.provider.id,
                        businessName: msg.quote.provider.business_name,
                        category: msg.quote.provider.category,
                      },
                    }
                  : null,
                createdAt: msg.created_at,
              };

              const data = `data: ${JSON.stringify(formatted)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Mark as read
            await prisma.conversationParticipant.update({
              where: {
                conversation_id_user_id: {
                  conversation_id: conversationId,
                  user_id: session.id,
                },
              },
              data: { last_read_at: new Date() },
            });
          }

          // Send keepalive every 30 seconds
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (error) {
          // If connection is closed, stop polling
          if (!closed) {
            console.error('SSE poll error:', error);
          }
          return;
        }

        // Poll every 8 seconds
        if (!closed) {
          setTimeout(poll, 8000);
        }
      };

      // Start polling
      poll();

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        closed = true;
      });
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
