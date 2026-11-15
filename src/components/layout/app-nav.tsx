'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Compass,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  PartyPopper,
  Settings,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { logoutAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils';
import type { NavIcon, NavItem } from '@/components/layout/nav-config';

const ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  events: PartyPopper,
  requests: Inbox,
  quotes: FileText,
  bookings: CalendarCheck,
  messages: MessageSquare,
  agenda: CalendarDays,
  profile: Store,
  providers: Briefcase,
  users: Users,
  waitlist: ListChecks,
  reports: Flag,
  discover: Compass,
};

const POLL_MS = 30_000;

/** Unread message count: starts from the server value, then refreshes while the tab is visible. */
function useUnreadCount(initial: number) {
  const [count, setCount] = React.useState(initial);
  const pathname = usePathname();

  React.useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch('/api/conversations/unread', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { unread: number };
        if (!cancelled) setCount(data.unread);
      } catch {
        // Offline or navigating away: try again on the next tick.
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
    // Re-check after every navigation (e.g. after reading a conversation).
  }, [pathname]);

  return count;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function UnreadDot({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-bold text-white',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
      <span className="sr-only"> ongelezen</span>
    </span>
  );
}

interface AppNavProps {
  items: NavItem[];
  initialUnread: number;
}

/** Desktop sidebar navigation. */
export function SidebarNav({ items, initialUnread }: AppNavProps) {
  const pathname = usePathname();
  const unread = useUnreadCount(initialUnread);
  return (
    <nav aria-label="Hoofdmenu">
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                  active ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
                )}
              >
                <Icon className={cn('size-5 shrink-0', active ? 'text-brand-700' : 'text-ink-400')} aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.unread && <UnreadDot count={unread} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile tab bar: four primary destinations plus a "Meer" sheet with the rest. */
export function MobileTabBar({ items, initialUnread }: AppNavProps) {
  const pathname = usePathname();
  const unread = useUnreadCount(initialUnread);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const primary = items.slice(0, 4);
  const secondary = items.slice(4);
  const moreActive = secondary.some((item) => isActive(pathname, item)) || pathname.startsWith('/account');

  React.useEffect(() => setMoreOpen(false), [pathname]);

  const tabClass = (active: boolean) =>
    cn(
      'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors',
      active ? 'text-brand-700' : 'text-ink-500',
    );

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="flex">
        {primary.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item);
          return (
            <li key={item.href} className="flex flex-1">
              <Link href={item.href} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {item.unread && <UnreadDot count={unread} className="absolute -right-3.5 -top-2 h-4 min-w-4 px-1 text-[0.625rem]" />}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
            <DialogTrigger className={tabClass(moreActive)}>
              <Menu className="size-5" aria-hidden />
              Meer
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Menu</DialogTitle>
              </DialogHeader>
              <DialogBody className="pb-6">
                <ul className="space-y-1">
                  {[...secondary, { href: '/account', label: 'Account & privacy', icon: 'profile' as NavIcon }].map((item) => {
                    const Icon = item.href === '/account' ? Settings : ICONS[item.icon];
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold text-ink-900 hover:bg-ink-100"
                        >
                          <Icon className="size-5 text-ink-400" aria-hidden />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button"
                      onClick={() => void logoutAction()}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold text-danger-700 hover:bg-danger-50"
                    >
                      <LogOut className="size-5" aria-hidden />
                      Uitloggen
                    </button>
                  </li>
                </ul>
              </DialogBody>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </nav>
  );
}

