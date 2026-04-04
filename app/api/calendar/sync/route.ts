import { NextRequest, NextResponse } from 'next/server';
import { requireProvider } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { syncGoogleCalendar } from '@/lib/googleCalendarSync';
import { syncIcalCalendar } from '@/lib/icalSync';
import { addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const SYNC_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// POST - Manuele sync of automatische sync bij paginabezoek
export async function POST(request: NextRequest) {
  const { error, session } = await requireProvider();
  if (error) return error;

  const providerId = session!.providerId!;
  const body = await request.json().catch(() => ({}));
  const force = (body as { force?: boolean }).force === true;

  const integrations = await prisma.calendarIntegration.findMany({
    where: { provider_id: providerId, is_active: true },
  });

  if (integrations.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const from = startOfMonth(subMonths(new Date(), 1));
  const to = endOfMonth(addMonths(new Date(), 6));

  const results: { type: string; success: boolean; error?: string }[] = [];

  for (const integration of integrations) {
    // Check cooldown (skip if synced within last 30 min, unless forced)
    if (!force && integration.last_synced_at) {
      const elapsed = Date.now() - integration.last_synced_at.getTime();
      if (elapsed < SYNC_COOLDOWN_MS) {
        results.push({ type: integration.type, success: true });
        continue;
      }
    }

    try {
      if (integration.type === 'GOOGLE') {
        await syncGoogleCalendar(integration.id, from, to);
      } else if (integration.type === 'ICAL') {
        await syncIcalCalendar(integration.id, from, to);
      }
      results.push({ type: integration.type, success: true });
    } catch (err) {
      results.push({
        type: integration.type,
        success: false,
        error: (err as Error).message,
      });
    }
  }

  const synced = results.filter((r) => r.success).length;
  return NextResponse.json({ synced, results });
}
