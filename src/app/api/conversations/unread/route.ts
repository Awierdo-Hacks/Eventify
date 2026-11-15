import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getUnreadCount } from '@/features/messaging/unread';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unread: 0 }, { status: 401 });
  const unread = await getUnreadCount(user.id);
  return NextResponse.json({ unread }, { headers: { 'Cache-Control': 'private, no-store' } });
}
