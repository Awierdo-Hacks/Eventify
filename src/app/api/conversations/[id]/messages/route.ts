import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import {
  getMessagesAfter,
  isParticipant,
  markConversationRead,
} from '@/features/messaging/queries';

/**
 * New messages since a timestamp. The thread polls this every few seconds
 * while it is on screen; the response is tiny when nothing changed.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ messages: [] }, { status: 401 });

  const { id } = await params;
  if (!(await isParticipant(user.id, id)))
    return NextResponse.json({ messages: [] }, { status: 403 });

  const after = request.nextUrl.searchParams.get('after') ?? new Date().toISOString();
  const messages = await getMessagesAfter(id, after);
  if (messages.some((message) => message.senderId !== user.id))
    await markConversationRead(user.id, id);

  return NextResponse.json({ messages }, { headers: { 'Cache-Control': 'private, no-store' } });
}
