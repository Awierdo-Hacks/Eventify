import type { Metadata } from 'next';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { listConversations } from '@/features/messaging/queries';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Berichten' };

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/messages');
  const conversations = await listConversations(user.id);

  return (
    // Fills the space between the app chrome: top bar + tab bar on phones.
    <div className="-mx-4 -mb-28 -mt-6 flex h-[calc(100dvh-3.5rem-3.5rem-env(safe-area-inset-bottom))] overflow-hidden border-ink-200 bg-surface sm:-mx-6 lg:mx-0 lg:-mb-6 lg:mt-0 lg:h-[calc(100dvh-5rem)] lg:rounded-2xl lg:border lg:shadow-xs">
      <ConversationList initial={conversations} />
      {children}
    </div>
  );
}
