import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';
import { pendingTermsFor } from '@/features/legal/acceptance';
import { TermsGate } from '@/features/legal/terms-gate';
import { getUnreadCount } from '@/features/messaging/unread';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unread, pendingTerms] = await Promise.all([
    getUnreadCount(user.id),
    pendingTermsFor(user.id, user.role),
  ]);

  return (
    <AppShell user={user} unread={unread}>
      {children}
      {pendingTerms && (
        <TermsGate
          terms={{
            title: pendingTerms.title,
            href: pendingTerms.href,
            updatedLabel: pendingTerms.updatedLabel,
          }}
        />
      )}
    </AppShell>
  );
}
