import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { EventForm } from '@/features/events/components/event-form';
import { requireCustomer } from '@/lib/session';

export const metadata: Metadata = { title: 'Nieuw event' };

export default async function NewEventPage() {
  await requireCustomer('/dashboard/events/new');
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Nieuw event"
        description="Kies een sjabloon en pas aan wat je nodig hebt."
        back={{ href: '/dashboard/events', label: 'Events' }}
      />
      <EventForm />
    </div>
  );
}
