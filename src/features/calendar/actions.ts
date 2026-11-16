'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { rateLimit, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import { disconnectGoogleCalendar } from '@/features/calendar/google';
import { normalizeCalendarUrl, UnsafeUrlError } from '@/features/calendar/safe-fetch';
import { syncProviderCalendars } from '@/features/calendar/sync';

const dateKeys = z
  .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .min(1, 'Kies minstens één dag.')
  .max(366);

async function provider() {
  const user = await getCurrentUser();
  return user?.role === 'PROVIDER' && user.providerId
    ? { ...user, providerId: user.providerId }
    : null;
}

const NOT_ALLOWED = 'Alleen dienstverleners kunnen hun agenda beheren.';

export async function blockDatesAction(input: {
  dates: string[];
  reason?: string;
}): Promise<ActionResult> {
  const user = await provider();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = dateKeys.safeParse(input.dates);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? GENERIC_ERROR);
  const reason = input.reason?.trim().slice(0, 200) || null;

  try {
    const dates = parsed.data.map((key) => new Date(`${key}T00:00:00.000Z`));
    await db.$transaction([
      db.blockedDate.deleteMany({ where: { provider_id: user.providerId, date: { in: dates } } }),
      db.blockedDate.createMany({
        data: dates.map((date) => ({ provider_id: user.providerId, date, reason })),
      }),
    ]);
  } catch (error) {
    console.error('[calendar] block failed', error);
    return fail(GENERIC_ERROR);
  }
  revalidateApp();
  return ok(
    undefined,
    parsed.data.length === 1 ? 'Dag geblokkeerd.' : `${parsed.data.length} dagen geblokkeerd.`
  );
}

export async function unblockDatesAction(input: { dates: string[] }): Promise<ActionResult> {
  const user = await provider();
  if (!user) return fail(NOT_ALLOWED);
  const parsed = dateKeys.safeParse(input.dates);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? GENERIC_ERROR);

  try {
    await db.blockedDate.deleteMany({
      where: {
        provider_id: user.providerId,
        date: { in: parsed.data.map((key) => new Date(`${key}T00:00:00.000Z`)) },
      },
    });
  } catch (error) {
    console.error('[calendar] unblock failed', error);
    return fail(GENERIC_ERROR);
  }
  revalidateApp();
  return ok(undefined, 'Dagen weer vrijgegeven.');
}

export async function connectIcalAction(input: { url: string }): Promise<ActionResult> {
  const user = await provider();
  if (!user) return fail(NOT_ALLOWED);
  if (!rateLimit(`ical:${user.id}`, 10, 10 * 60_000).allowed) return fail(TOO_MANY_REQUESTS);

  let url: URL;
  try {
    url = normalizeCalendarUrl(String(input.url ?? ''));
  } catch (error) {
    return fail(error instanceof UnsafeUrlError ? error.message : 'Dit is geen geldige URL.');
  }

  try {
    await db.calendarIntegration.upsert({
      where: { provider_id_type: { provider_id: user.providerId, type: 'ICAL' } },
      create: {
        provider_id: user.providerId,
        type: 'ICAL',
        is_active: true,
        ical_url: url.toString(),
      },
      update: {
        is_active: true,
        ical_url: url.toString(),
        ical_last_etag: null,
        sync_error: null,
        last_synced_at: null,
      },
    });
    const results = await syncProviderCalendars(user.providerId, { force: true });
    const result = results.find((entry) => entry.type === 'ICAL');
    revalidateApp();
    if (result && !result.ok) {
      // Do not keep a connection that never worked.
      await db.calendarIntegration.deleteMany({
        where: { provider_id: user.providerId, type: 'ICAL' },
      });
      return fail(result.error ?? 'De kalender kon niet gelezen worden.');
    }
  } catch (error) {
    console.error('[calendar] ical connect failed', error);
    return fail(GENERIC_ERROR);
  }
  return ok(undefined, 'iCal-kalender gekoppeld.');
}

export async function disconnectCalendarAction(input: {
  type: 'GOOGLE' | 'ICAL';
}): Promise<ActionResult> {
  const user = await provider();
  if (!user) return fail(NOT_ALLOWED);
  try {
    if (input.type === 'GOOGLE') await disconnectGoogleCalendar(user.providerId);
    else
      await db.calendarIntegration.deleteMany({
        where: { provider_id: user.providerId, type: 'ICAL' },
      });
  } catch (error) {
    console.error('[calendar] disconnect failed', error);
    return fail(GENERIC_ERROR);
  }
  revalidateApp();
  return ok(undefined, 'Koppeling verwijderd. De geïmporteerde dagen zijn gewist.');
}

export async function syncCalendarsAction(): Promise<ActionResult> {
  const user = await provider();
  if (!user) return fail(NOT_ALLOWED);
  if (!rateLimit(`sync:${user.id}`, 6, 10 * 60_000).allowed) return fail(TOO_MANY_REQUESTS);
  try {
    const results = await syncProviderCalendars(user.providerId, { force: true });
    revalidateApp();
    const failed = results.find((result) => !result.ok);
    if (failed) return fail(failed.error ?? 'Synchroniseren is mislukt.');
    if (results.length === 0) return fail('Er is nog geen kalender gekoppeld.');
  } catch (error) {
    console.error('[calendar] sync failed', error);
    return fail(GENERIC_ERROR);
  }
  return ok(undefined, 'Agenda gesynchroniseerd.');
}
