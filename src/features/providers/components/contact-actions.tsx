'use client';

import Link from 'next/link';
import { FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAction } from '@/hooks/use-action';
import { openConversationAction } from '@/features/messaging/open-conversation';

interface ContactActionsProps {
  providerId: string;
  providerUserId: string;
  /** Role of the viewer, or null when signed out. */
  viewerRole: string | null;
  isOwnProfile: boolean;
}

function ContactActions({ providerId, providerUserId, viewerRole, isOwnProfile }: ContactActionsProps) {
  const { run, pending } = useAction(openConversationAction);
  const quoteHref = `/request-quote/${providerId}`;

  if (isOwnProfile) {
    return (
      <Button asChild size="lg" variant="outline" className="w-full">
        <Link href="/provider-dashboard/profile">Profiel bewerken</Link>
      </Button>
    );
  }

  if (viewerRole === 'PROVIDER' || viewerRole === 'ADMIN') {
    return (
      <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-600">
        Offertes aanvragen kan met een klantaccount.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <Button asChild size="lg" variant="gradient" className="w-full">
        <Link href={viewerRole ? quoteHref : `/login?redirect=${encodeURIComponent(quoteHref)}`}>
          <FileText aria-hidden /> Offerte aanvragen
        </Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full"
        loading={pending}
        onClick={() => run({ recipientId: providerUserId, returnTo: `/providers/${providerId}` })}
      >
        <MessageSquare aria-hidden /> Stuur een bericht
      </Button>
      <p className="pt-1 text-center text-xs text-ink-500">Gratis en vrijblijvend</p>
    </div>
  );
}

export { ContactActions };
