import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl, getSourceDatabaseUrl } from "@/lib/database-url";

const sourceAdapter = new PrismaPg({ connectionString: getSourceDatabaseUrl() });
const targetAdapter = new PrismaPg({ connectionString: getDatabaseUrl() });

const source = new PrismaClient({ adapter: sourceAdapter });
const target = new PrismaClient({ adapter: targetAdapter });

type QuoteRow = Awaited<ReturnType<typeof source.quote.findMany>>[number];
type EventSlotRow = Awaited<ReturnType<typeof source.eventSlot.findMany>>[number];
type ImportStep = {
  name: string;
  clear: () => Promise<unknown>;
  read: () => Promise<unknown[]>;
  write: (rows: unknown[]) => Promise<unknown>;
};

function isMissingTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2021"
  );
}

const importPlan: ImportStep[] = [
  {
    name: "users",
    clear: () => target.user.deleteMany(),
    read: () => source.user.findMany(),
    write: (rows) =>
      rows.length ? target.user.createMany({ data: rows as Awaited<ReturnType<typeof source.user.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "service providers",
    clear: () => target.serviceProvider.deleteMany(),
    read: () => source.serviceProvider.findMany(),
    write: (rows) =>
      rows.length ? target.serviceProvider.createMany({ data: rows as Awaited<ReturnType<typeof source.serviceProvider.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "provider services",
    clear: () => target.providerService.deleteMany(),
    read: () => source.providerService.findMany(),
    write: (rows) =>
      rows.length ? target.providerService.createMany({ data: rows as Awaited<ReturnType<typeof source.providerService.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "blocked dates",
    clear: () => target.blockedDate.deleteMany(),
    read: () => source.blockedDate.findMany(),
    write: (rows) =>
      rows.length ? target.blockedDate.createMany({ data: rows as Awaited<ReturnType<typeof source.blockedDate.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "calendar integrations",
    clear: () => target.calendarIntegration.deleteMany(),
    read: () => source.calendarIntegration.findMany(),
    write: (rows) =>
      rows.length ? target.calendarIntegration.createMany({ data: rows as Awaited<ReturnType<typeof source.calendarIntegration.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "external calendar events",
    clear: () => target.externalCalendarEvent.deleteMany(),
    read: () => source.externalCalendarEvent.findMany(),
    write: (rows) =>
      rows.length ? target.externalCalendarEvent.createMany({ data: rows as Awaited<ReturnType<typeof source.externalCalendarEvent.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "waitlist entries",
    clear: () => target.waitlistEntry.deleteMany(),
    read: () => source.waitlistEntry.findMany(),
    write: (rows) =>
      rows.length ? target.waitlistEntry.createMany({ data: rows as Awaited<ReturnType<typeof source.waitlistEntry.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "service requests",
    clear: () => target.serviceRequest.deleteMany(),
    read: () => source.serviceRequest.findMany(),
    write: (rows) =>
      rows.length ? target.serviceRequest.createMany({ data: rows as Awaited<ReturnType<typeof source.serviceRequest.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "quotes",
    clear: () => target.quote.deleteMany(),
    read: () => source.quote.findMany(),
    write: (rows) =>
      rows.length
        ? target.quote.createMany({
            data: (rows as QuoteRow[]).map(({ event_slot_id, ...row }) => row),
          })
        : Promise.resolve({ count: 0 }),
  },
  {
    name: "events",
    clear: () => target.event.deleteMany(),
    read: () => source.event.findMany(),
    write: (rows) =>
      rows.length ? target.event.createMany({ data: rows as Awaited<ReturnType<typeof source.event.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "event slots",
    clear: () => target.eventSlot.deleteMany(),
    read: () => source.eventSlot.findMany(),
    write: (rows) =>
      rows.length
        ? target.eventSlot.createMany({
            data: (rows as EventSlotRow[]).map(({ booked_quote_id, ...row }) => row),
          })
        : Promise.resolve({ count: 0 }),
  },
  {
    name: "bookings",
    clear: () => target.booking.deleteMany(),
    read: () => source.booking.findMany(),
    write: (rows) =>
      rows.length ? target.booking.createMany({ data: rows as Awaited<ReturnType<typeof source.booking.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "reviews",
    clear: () => target.review.deleteMany(),
    read: () => source.review.findMany(),
    write: (rows) =>
      rows.length ? target.review.createMany({ data: rows as Awaited<ReturnType<typeof source.review.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "conversations",
    clear: () => target.conversation.deleteMany(),
    read: () => source.conversation.findMany(),
    write: (rows) =>
      rows.length ? target.conversation.createMany({ data: rows as Awaited<ReturnType<typeof source.conversation.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "conversation participants",
    clear: () => target.conversationParticipant.deleteMany(),
    read: () => source.conversationParticipant.findMany(),
    write: (rows) =>
      rows.length ? target.conversationParticipant.createMany({ data: rows as Awaited<ReturnType<typeof source.conversationParticipant.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "messages",
    clear: () => target.message.deleteMany(),
    read: () => source.message.findMany(),
    write: (rows) =>
      rows.length ? target.message.createMany({ data: rows as Awaited<ReturnType<typeof source.message.findMany>> }) : Promise.resolve({ count: 0 }),
  },
  {
    name: "message attachments",
    clear: () => target.messageAttachment.deleteMany(),
    read: () => source.messageAttachment.findMany(),
    write: (rows) =>
      rows.length ? target.messageAttachment.createMany({ data: rows as Awaited<ReturnType<typeof source.messageAttachment.findMany>> }) : Promise.resolve({ count: 0 }),
  },
];

async function syncQuoteAndSlotLinks(quotes: QuoteRow[], eventSlots: EventSlotRow[]) {
  const quoteLinks = quotes.filter((quote) => quote.event_slot_id);
  for (const quote of quoteLinks) {
    await target.quote.update({
      where: { id: quote.id },
      data: { event_slot_id: quote.event_slot_id },
    });
  }

  const slotLinks = eventSlots.filter((slot) => slot.booked_quote_id);
  for (const slot of slotLinks) {
    await target.eventSlot.update({
      where: { id: slot.id },
      data: { booked_quote_id: slot.booked_quote_id },
    });
  }

  console.log(
    `Restored ${quoteLinks.length} quote-to-slot links and ${slotLinks.length} slot-to-booked-quote links.`
  );
}

async function main() {
  const sourceUrl = new URL(getSourceDatabaseUrl());
  const targetUrl = new URL(getDatabaseUrl());

  if (sourceUrl.href === targetUrl.href) {
    throw new Error("Source and target database URLs must be different.");
  }

  console.log(`Copying data from ${sourceUrl.hostname} to ${targetUrl.hostname}...`);

  await source.$connect();
  await target.$connect();

  const targetClearOrder = [...importPlan].reverse();
  for (const step of targetClearOrder) {
    try {
      await step.clear();
    } catch (error) {
      if (isMissingTableError(error)) {
        console.log(`Skipped clearing ${step.name} because the target table does not exist yet.`);
        continue;
      }

      throw error;
    }
  }

  let quotes: QuoteRow[] = [];
  let eventSlots: EventSlotRow[] = [];

  for (const step of importPlan) {
    let rows: unknown[] = [];
    try {
      rows = await step.read();
    } catch (error) {
      if (isMissingTableError(error)) {
        console.log(`Skipped ${step.name} because the source table does not exist.`);
        continue;
      }

      throw error;
    }

    await step.write(rows);
    console.log(`Imported ${rows.length} ${step.name}.`);

    if (step.name === "quotes") {
      quotes = rows as QuoteRow[];
    }

    if (step.name === "event slots") {
      eventSlots = rows as EventSlotRow[];
    }
  }

  await syncQuoteAndSlotLinks(quotes, eventSlots);

  console.log("Render-to-Prisma copy completed successfully.");
}

main()
  .catch((error) => {
    console.error("Copy failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
