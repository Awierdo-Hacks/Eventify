import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Agenda } from '@/features/calendar/agenda';
import { getAgenda } from '@/features/calendar/queries';
import { syncProviderCalendars } from '@/features/calendar/sync';
import { requireProvider } from '@/lib/session';

export const metadata: Metadata = { title: 'Agenda' };

const SYNC_MESSAGES: Record<string, { tone: 'success' | 'warning' | 'danger'; text: string }> = {
  connected: {
    tone: 'success',
    text: 'Google Calendar is gekoppeld. Je bezette dagen zijn overgenomen.',
  },
  cancelled: { tone: 'warning', text: 'De koppeling met Google Calendar is niet voltooid.' },
  error: {
    tone: 'danger',
    text: 'De koppeling met Google Calendar is mislukt. Probeer het opnieuw.',
  },
  unavailable: { tone: 'warning', text: 'Koppelen met Google Calendar is nog niet beschikbaar.' },
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ sync?: string }>;
}) {
  const user = await requireProvider('/provider-dashboard/agenda');
  const { sync } = await searchParams;

  // Refresh connected calendars when they are older than the cooldown; a
  // failed sync never blocks the page.
  await syncProviderCalendars(user.providerId).catch(() => undefined);
  const data = await getAgenda(user.providerId);
  const message = sync ? SYNC_MESSAGES[sync] : undefined;

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Klanten zien alleen op welke dagen je niet beschikbaar bent."
      />
      {message && (
        <Alert tone={message.tone} className="mb-6">
          {message.text}
        </Alert>
      )}
      <Agenda data={data} />
    </>
  );
}
