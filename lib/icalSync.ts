import { prisma } from "./prisma";
import { format, addDays, parseISO, isValid } from "date-fns";
import ical, { VEvent } from "node-ical";

export async function syncIcalCalendar(
  integrationId: string,
  fromDate: Date,
  toDate: Date
): Promise<void> {
  const integration = await prisma.calendarIntegration.findUniqueOrThrow({
    where: { id: integrationId },
  });

  if (!integration.ical_url) {
    throw new Error("Geen iCal URL geconfigureerd");
  }

  // Fetch with conditional ETag
  const headers: Record<string, string> = {};
  if (integration.ical_last_etag) {
    headers["If-None-Match"] = integration.ical_last_etag;
  }

  const res = await fetch(integration.ical_url, { headers });

  if (res.status === 304) {
    // Not modified — update last_synced_at only
    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: { last_synced_at: new Date(), sync_error: null },
    });
    return;
  }

  if (!res.ok) {
    const errMsg = `iCal URL niet bereikbaar (HTTP ${res.status})`;
    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: { sync_error: errMsg },
    });
    throw new Error(errMsg);
  }

  const newEtag = res.headers.get("etag");
  const icsText = await res.text();

  let events: ical.CalendarResponse;
  try {
    events = ical.parseICS(icsText);
  } catch {
    const errMsg = "Ongeldige iCal inhoud";
    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: { sync_error: errMsg },
    });
    throw new Error(errMsg);
  }

  // Collect all days that are busy in the requested range
  const days = new Map<string, string>(); // dateStr -> title

  for (const event of Object.values(events)) {
    if (!event || event.type !== "VEVENT") continue;
    const vevent = event as VEvent;

    const eventStart = vevent.start as Date;
    const eventEnd = (vevent.end as Date) ?? eventStart;

    if (!isValid(eventStart)) continue;

    // Expand to individual days within our date range
    let current = new Date(eventStart);
    current.setHours(0, 0, 0, 0);
    const end = new Date(eventEnd);
    end.setHours(0, 0, 0, 0);

    // For recurring events, node-ical resolves them so each occurrence is separate
    do {
      if (current >= fromDate && current <= toDate) {
        const dateStr = format(current, "yyyy-MM-dd");
        const title = (vevent.summary as string) ?? "Bezet (iCalendar)";
        if (!days.has(dateStr)) {
          days.set(dateStr, title);
        }
      }
      current = addDays(current, 1);
    } while (current <= end);
  }

  // Replace existing synced events in the date range
  await prisma.externalCalendarEvent.deleteMany({
    where: {
      integration_id: integrationId,
      start_date: { gte: fromDate, lte: toDate },
    },
  });

  if (days.size > 0) {
    await prisma.externalCalendarEvent.createMany({
      data: Array.from(days.entries()).map(([dateStr, title]) => ({
        integration_id: integrationId,
        external_uid: `ical-${integrationId}-${dateStr}`,
        title,
        start_date: new Date(dateStr),
        end_date: new Date(dateStr),
        is_all_day: true,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.calendarIntegration.update({
    where: { id: integrationId },
    data: {
      last_synced_at: new Date(),
      sync_error: null,
      ...(newEtag ? { ical_last_etag: newEtag } : {}),
    },
  });
}

export async function validateIcalUrl(url: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      // Try GET if HEAD fails
      res = await fetch(url);
    }
  } catch {
    throw new Error("URL niet bereikbaar. Controleer het adres en probeer opnieuw.");
  }

  if (!res.ok) {
    throw new Error(`URL geeft fout terug (HTTP ${res.status})`);
  }
}

export async function disconnectIcalCalendar(providerId: string): Promise<void> {
  await prisma.calendarIntegration.delete({
    where: { provider_id_type: { provider_id: providerId, type: "ICAL" } },
  });
}
