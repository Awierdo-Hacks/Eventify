import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { MobileTabBar, SidebarNav } from '@/components/layout/app-nav';
import { NAVIGATION } from '@/components/layout/nav-config';
import { UserMenu } from '@/components/layout/user-menu';
import { Avatar } from '@/components/ui/avatar';
import { ROLE_LABELS } from '@/lib/catalog';
import type { CurrentUser } from '@/lib/session';
import { dashboardPathFor } from '@/lib/session-token';

interface AppShellProps {
  user: CurrentUser;
  unread: number;
  children: React.ReactNode;
}

/**
 * Signed-in layout: fixed sidebar on desktop, top bar plus tab bar on phones.
 * It renders once and stays mounted while the pages inside it change.
 */
function AppShell({ user, unread, children }: AppShellProps) {
  const items = NAVIGATION[user.role];
  const home = dashboardPathFor(user.role);

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-200 bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href={home} aria-label="Eventiphy, naar je overzicht" className="rounded-lg">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNav items={items} initialUnread={unread} />
        </div>
        <div className="border-t border-ink-100 p-3">
          <Link
            href="/account"
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-ink-100"
          >
            <Avatar name={user.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink-950">{user.name}</span>
              <span className="block truncate text-xs text-ink-500">{ROLE_LABELS[user.role]}</span>
            </span>
            <Settings className="size-4 shrink-0 text-ink-400" aria-hidden />
            <span className="sr-only">Account & privacy</span>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-200 bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link href={home} aria-label="Eventiphy, naar je overzicht" className="rounded-lg">
          <Logo />
        </Link>
        <UserMenu user={user} dashboardHref={home} />
      </header>

      <main id="inhoud" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
        {children}
      </main>

      <MobileTabBar items={items} initialUnread={unread} />
    </div>
  );
}

export { AppShell };
