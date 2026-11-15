import type { Metadata } from 'next';
import Link from 'next/link';
import { PartyPopper, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from '@/features/events/components/event-card';
import { getCustomerEvents } from '@/features/events/queries';
import { requireCustomer } from '@/lib/session';

export const metadata: Metadata = { title: 'Events' };

export default async function EventsPage() {
  const user = await requireCustomer('/dashboard/events');
  const events = await getCustomerEvents(user.id);

  return (
    <>
      <PageHeader
        title="Events"
        description="Elk event met alles wat je ervoor nodig hebt."
        actions={
          <Button asChild>
            <Link href="/dashboard/events/new">
              <Plus aria-hidden /> Nieuw event
            </Link>
          </Button>
        }
      />
      {events.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="Nog geen events"
          description="Begin met een sjabloon voor een bruiloft, verjaardag of bedrijfsfeest, of stel zelf samen wat je nodig hebt."
          action={
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus aria-hidden /> Event aanmaken
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
