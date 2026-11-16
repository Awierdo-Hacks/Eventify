import 'server-only';
import ical, { type VEvent } from 'node-ical';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { decryptToken, encryptToken } from '@/features/calendar/encryption';
import { safeFetchText, UnsafeUrlError } from '@/features/calendar/safe-fetch';

const DAY_MS = 24 * 60 * 60 * 1000;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';

export const SYNC_COOLDOWN_MS = 30 * 60 * 1000;

/** Window that is kept in sync: last month up to a year and a half ahead. */
export function syncWindow(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 19, 0));
  return { from, to };
}

const dayKeyOf = (date: Date) => date.toISOString().slice(0, 10);

/** Every calendar day (UTC keys) touched by [start, end). */
function daysBetween(start: Date, end: Date, from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const last = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  // An event ending exactly at midnight does not occupy that last day.
  const endsAtMidnight =
    end.getHours() === 0 && end.getMinutes() === 0 && end.getTime() > start.getTime();
  if (endsAtMidnight) last.setUTCDate(last.getUTCDate() - 1);
  for (let guard = 0; cursor <= last && guard < 800; guard++) {
    if (cursor >= from && cursor <= to) days.push(dayKeyOf(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

async function storeBusyDays(
  integrationId: string,
  days: Map<string, string>,
  from: Date,
  to: Date,
  prefix: string
) {
  await db.$transaction([
    db.externalCalendarEvent.deleteMany({
      where: { integration_id: integrationId, start_date: { gte: from, lte: to } },
    }),
    db.externalCalendarEvent.createMany({
      data: [...days.entries()].map(([key, title]) => ({
        integration_id: integrationId,
        external_uid: `${prefix}-${integrationId}-${key}`,
        title,
        start_date: new Date(`${key}T00:00:00.000Z`),
        end_date: new Date(`${key}T00:00:00.000Z`),
        is_all_day: true,
      })),
      skipDuplicates: true,
    }),
  ]);
}

async function syncIcal(
  integration: { id: string; ical_url: string | null; ical_last_etag: string | null },
  from: Date,
  to: Date
) {
  if (!integration.ical_url) throw new Error('Geen iCal-link ingesteld.');
  const response = await safeFetchText(
    integration.ical_url,
    integration.ical_last_etag ? { 'If-None-Match': integration.ical_last_etag } : {}
  );
  if (response.status === 304) return;
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`De iCal-link is niet bereikbaar (HTTP ${response.status}).`);
  }

  let parsed: ReturnType<typeof ical.sync.parseICS>;
  try {
    parsed = ical.sync.parseICS(response.text);
  } catch {
    throw new Error('De link bevat geen geldige kalender.');
  }

  const days = new Map<string, string>();
  for (const component of Object.values(parsed)) {
    if (!component || component.type !== 'VEVENT') continue;
    const event = component as VEvent;
    if (String(event.transparency ?? '').toUpperCase() === 'TRANSPARENT') continue; // marked as "free"
    try {
      // Also covers recurring events, which v1 ignored.
      const instances = ical.expandRecurringEvent(event, {
        from,
        to: new Date(to.getTime() + DAY_MS),
        expandOngoing: true,
        maxIterations: 2000,
      });
      for (const instance of instances) {
        for (const key of daysBetween(instance.start, instance.end ?? instance.start, from, to)) {
          if (!days.has(key)) days.set(key, 'Bezet (iCal)');
        }
      }
    } catch {
      // Skip a malformed event rather than failing the whole calendar.
    }
  }

  await storeBusyDays(integration.id, days, from, to, 'ical');
  if (response.etag) {
    await db.calendarIntegration.update({
      where: { id: integration.id },
      data: { ical_last_etag: response.etag },
    });
  }
}

async function googleAccessToken(integration: {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: Date | null;
}): Promise<string> {
  if (!integration.access_token) throw new Error('Google Calendar moet opnieuw gekoppeld worden.');
  const fresh =
    integration.token_expires_at &&
    integration.token_expires_at.getTime() > Date.now() + 5 * 60_000;
  if (fresh) return decryptToken(integration.access_token);

  if (!integration.refresh_token || !env.google.clientId || !env.google.clientSecret) {
    throw new Error('Google Calendar moet opnieuw gekoppeld worden.');
  }
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      refresh_token: decryptToken(integration.refresh_token),
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Google Calendar moet opnieuw gekoppeld worden.');
  const tokens = (await response.json()) as { access_token: string; expires_in: number };
  await db.calendarIntegration.update({
    where: { id: integration.id },
    data: {
      access_token: encryptToken(tokens.access_token),
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}

async function syncGoogle(
  integration: {
    id: string;
    access_token: string | null;
    refresh_token: string | null;
    token_expires_at: Date | null;
  },
  from: Date,
  to: Date
) {
  const accessToken = await googleAccessToken(integration);
  // Only free/busy information is read: never titles, guests or descriptions.
  const response = await fetch(GOOGLE_FREEBUSY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: 'Europe/Brussels',
      items: [{ id: 'primary' }],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('Google Calendar kon niet gelezen worden.');
  const data = (await response.json()) as {
    calendars?: { primary?: { busy?: Array<{ start: string; end: string }> } };
  };

  const days = new Map<string, string>();
  for (const slot of data.calendars?.primary?.busy ?? []) {
    // Shift to Brussels wall-clock time so a late-evening event lands on the right day.
    const toLocal = (iso: string) =>
      new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
    for (const key of daysBetween(toLocal(slot.start), toLocal(slot.end), from, to)) {
      days.set(key, 'Bezet (Google Calendar)');
    }
  }
  await storeBusyDays(integration.id, days, from, to, 'google');
}

export interface SyncResult {
  type: 'GOOGLE' | 'ICAL';
  ok: boolean;
  error?: string;
}

/** Sync all active calendar connections of a provider. */
export async function syncProviderCalendars(
  providerId: string,
  options: { force?: boolean } = {}
): Promise<SyncResult[]> {
  const integrations = await db.calendarIntegration.findMany({
    where: { provider_id: providerId, is_active: true },
  });
  const { from, to } = syncWindow();
  const results: SyncResult[] = [];

  for (const integration of integrations) {
    const recentlySynced =
      integration.last_synced_at &&
      Date.now() - integration.last_synced_at.getTime() < SYNC_COOLDOWN_MS;
    if (!options.force && recentlySynced) {
      results.push({ type: integration.type, ok: !integration.sync_error });
      continue;
    }
    try {
      if (integration.type === 'GOOGLE') await syncGoogle(integration, from, to);
      else await syncIcal(integration, from, to);
      await db.calendarIntegration.update({
        where: { id: integration.id },
        data: { last_synced_at: new Date(), sync_error: null },
      });
      results.push({ type: integration.type, ok: true });
    } catch (error) {
      const message =
        error instanceof UnsafeUrlError || error instanceof Error
          ? error.message.slice(0, 300)
          : 'Synchroniseren is mislukt.';
      await db.calendarIntegration.update({
        where: { id: integration.id },
        data: { sync_error: message },
      });
      results.push({ type: integration.type, ok: false, error: message });
    }
  }
  return results;
}
