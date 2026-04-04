import { NextResponse } from 'next/server';
import { requireProvider } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

// GET - Status van alle kalender-koppelingen voor de ingelogde provider
export async function GET() {
  const { error, session } = await requireProvider();
  if (error) return error;

  const integrations = await prisma.calendarIntegration.findMany({
    where: { provider_id: session!.providerId! },
    select: {
      id: true,
      type: true,
      is_active: true,
      google_account_email: true,
      ical_url: true,
      last_synced_at: true,
      sync_error: true,
    },
  });

  type IntRow = (typeof integrations)[number];
  const google: IntRow | undefined = integrations.find((i: IntRow) => i.type === 'GOOGLE');
  const ical: IntRow | undefined = integrations.find((i: IntRow) => i.type === 'ICAL');

  return NextResponse.json({
    google: google
      ? {
          connected: true,
          email: google.google_account_email,
          lastSynced: google.last_synced_at,
          error: google.sync_error,
          active: google.is_active,
        }
      : { connected: false },
    ical: ical
      ? {
          connected: true,
          url: ical.ical_url,
          lastSynced: ical.last_synced_at,
          error: ical.sync_error,
          active: ical.is_active,
        }
      : { connected: false },
  });
}
