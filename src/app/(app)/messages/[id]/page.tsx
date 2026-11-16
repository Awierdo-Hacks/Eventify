import { notFound } from 'next/navigation';
import { Thread } from '@/features/messaging/components/thread';
import { getThread, markConversationRead } from '@/features/messaging/queries';
import { getLinkableSlots } from '@/features/quotes/queries';
import { requireUser } from '@/lib/session';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);

  const [thread, linkableEvents] = await Promise.all([
    getThread(user.id, id),
    user.role === 'CUSTOMER' ? getLinkableSlots(user.id) : Promise.resolve([]),
  ]);
  if (!thread) notFound();
  await markConversationRead(user.id, id);

  return (
    <Thread
      key={thread.id}
      thread={thread}
      viewer={{ id: user.id, role: user.role }}
      linkableEvents={linkableEvents}
    />
  );
}
