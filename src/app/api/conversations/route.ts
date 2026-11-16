import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { listConversations } from '@/features/messaging/queries';

/** Conversation list for the inbox (polled while the tab is visible). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ conversations: [] }, { status: 401 });
  const conversations = await listConversations(user.id);
  return NextResponse.json(
    { conversations },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
