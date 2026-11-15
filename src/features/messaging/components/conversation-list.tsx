'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { formatChatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from '@/features/messaging/queries';

const POLL_MS = 15_000;

/**
 * Inbox. On phones it is the whole screen at /messages and hidden while a
 * conversation is open; on larger screens it sits next to the conversation.
 */
function ConversationList({ initial }: { initial: ConversationSummary[] }) {
  const pathname = usePathname();
  const [conversations, setConversations] = React.useState(initial);
  const [query, setQuery] = React.useState('');
  const activeId = pathname.startsWith('/messages/') ? pathname.split('/')[2] : null;

  React.useEffect(() => setConversations(initial), [initial]);

  React.useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch('/api/conversations', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { conversations: ConversationSummary[] };
        if (!cancelled) setConversations(data.conversations);
      } catch {
        // Try again on the next tick.
      }
    };
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [pathname]);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? conversations.filter((conversation) =>
        [conversation.other?.name, conversation.other?.subtitle, conversation.lastMessage?.preview].some((value) => value?.toLowerCase().includes(needle)),
      )
    : conversations;

  return (
    <div className={cn('flex min-h-0 flex-col border-ink-200 lg:w-80 lg:shrink-0 lg:border-r', activeId ? 'hidden lg:flex' : 'flex-1 lg:flex-none')}>
      <div className="border-b border-ink-100 p-4">
        <h1 className="text-xl font-extrabold text-ink-950">Berichten</h1>
        <div className="relative mt-3">
          <label htmlFor="conversation-search" className="sr-only">
            Zoek in gesprekken
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            id="conversation-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek in gesprekken"
            className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <MessageSquare className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-bold text-ink-950">{needle ? 'Niets gevonden' : 'Nog geen gesprekken'}</p>
          <p className="mt-1 text-sm text-ink-600">
            {needle ? 'Probeer een andere zoekterm.' : 'Start een gesprek vanaf het profiel van een dienstverlener of vanuit een aanvraag.'}
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto p-2" aria-label="Gesprekken">
          {visible.map((conversation) => {
            const active = conversation.id === activeId;
            const unread = conversation.unread > 0 && !active;
            return (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-lg p-3 transition-colors', active ? 'bg-brand-50' : 'hover:bg-ink-50')}
                >
                  <Avatar name={conversation.other?.name} src={conversation.other?.image} size="md" className="size-11" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate text-sm text-ink-950', unread ? 'font-extrabold' : 'font-semibold')}>
                        {conversation.other?.name ?? 'Gesprek'}
                      </span>
                      {conversation.lastMessage && (
                        <span className={cn('shrink-0 text-xs', unread ? 'font-bold text-brand-700' : 'text-ink-500')}>
                          {formatChatTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', unread ? 'font-semibold text-ink-900' : 'text-ink-600')}>
                        {conversation.lastMessage
                          ? `${conversation.lastMessage.own ? 'Jij: ' : ''}${conversation.lastMessage.preview}`
                          : 'Nog geen berichten'}
                      </span>
                      {unread && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-bold text-white">
                          {conversation.unread > 9 ? '9+' : conversation.unread}
                          <span className="sr-only"> ongelezen</span>
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export { ConversationList };
