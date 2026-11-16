import 'server-only';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { LEGAL_DOCUMENTS } from '@/features/legal/documents';
import { DEMO_ACCOUNTS, DEMO_EMAIL_SUFFIX } from '@/features/demo/config';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A calendar day relative to today, at UTC midnight (how event dates are stored). */
const day = (offset: number) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
};
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * DAY_MS - hours * 60 * 60 * 1000);
const email = (name: string) => `${name}${DEMO_EMAIL_SUFFIX}`;

/**
 * Create the demo accounts and a small, realistic set of data around them —
 * only if they do not exist yet. Nothing is ever deleted or overwritten, so it
 * is safe on a database that already has real data.
 *
 * Demo accounts get a random password nobody knows: they can only be entered
 * through the demo switcher, and stop being reachable when it is switched off.
 */
export async function ensureDemoData(): Promise<void> {
  const existing = await db.user.count({
    where: { email: { in: DEMO_ACCOUNTS.map((account) => account.email) } },
  });
  if (existing === DEMO_ACCOUNTS.length) return;
  if (existing > 0) {
    throw new Error(
      'Demo data is incomplete: some demo accounts exist and others do not. Remove them and try again.'
    );
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const acceptances = (termsKey: 'terms-customer' | 'terms-provider') => ({
    create: [
      { document: termsKey, version: LEGAL_DOCUMENTS[termsKey].version },
      { document: 'privacy', version: LEGAL_DOCUMENTS.privacy.version },
    ],
  });

  await db.$transaction(
    async (tx) => {
      // ── Accounts ────────────────────────────────────────────────────────
      await tx.user.create({
        data: {
          email: email('beheerder'),
          name: 'Beheerder',
          password_hash: passwordHash,
          role: 'ADMIN',
        },
      });

      const customer = await tx.user.create({
        data: {
          email: email('klant'),
          name: 'Emma Peeters',
          first_name: 'Emma',
          last_name: 'Peeters',
          phone: '+32 470 00 00 01',
          date_of_birth: new Date('1993-04-18'),
          password_hash: passwordHash,
          role: 'CUSTOMER',
          legal_acceptances: acceptances('terms-customer'),
        },
      });
      const secondCustomer = await tx.user.create({
        data: {
          email: email('klant2'),
          name: 'Tom Janssens',
          first_name: 'Tom',
          last_name: 'Janssens',
          phone: '+32 470 00 00 02',
          password_hash: passwordHash,
          role: 'CUSTOMER',
          legal_acceptances: acceptances('terms-customer'),
        },
      });

      const provider = async (input: {
        login: string;
        contact: string;
        business: string;
        category: string;
        location: string;
        price: 'LOW' | 'MEDIUM' | 'HIGH' | 'PREMIUM';
        description: string;
        tags: string[];
        verified?: boolean;
        minGuests?: number;
        maxGuests?: number;
        services: Array<{ name: string; description: string; from: number; to?: number }>;
      }) => {
        const user = await tx.user.create({
          data: {
            email: email(input.login),
            name: input.contact,
            phone: '+32 3 000 00 00',
            password_hash: passwordHash,
            role: 'PROVIDER',
            legal_acceptances: acceptances('terms-provider'),
            provider: {
              create: {
                business_name: input.business,
                category: input.category,
                location: input.location,
                price_range: input.price,
                description: input.description,
                services: input.tags,
                images: [],
                portfolio_images: [],
                phone: '+32 3 000 00 00',
                response_time: 'Binnen 24 uur',
                availability: 'Weekends en feestdagen',
                min_guests: input.minGuests ?? null,
                max_guests: input.maxGuests ?? null,
                verified: input.verified ?? true,
                provider_services: {
                  create: input.services.map((service) => ({
                    name: service.name,
                    description: service.description,
                    price_from: service.from,
                    price_to: service.to ?? null,
                  })),
                },
              },
            },
          },
          select: { id: true, provider: { select: { id: true } } },
        });
        return { userId: user.id, id: user.provider!.id };
      };

      const caterer = await provider({
        login: 'cateraar',
        contact: 'Sofie De Smet',
        business: 'Atelier Smaak',
        category: 'catering',
        location: 'Antwerpen',
        price: 'HIGH',
        description:
          'Atelier Smaak verzorgt catering op maat voor bruiloften en bedrijfsfeesten. We koken met lokale seizoensproducten en denken graag mee over een menu dat bij jullie past, van walking dinner tot uitgebreid diner aan tafel.',
        tags: ['Walking dinner', 'Vegetarisch', 'Lokale producten', 'Bediening'],
        minGuests: 20,
        maxGuests: 300,
        services: [
          {
            name: 'Walking dinner',
            description: 'Zes tot acht gerechten, rondgebracht door onze bediening.',
            from: 45,
            to: 75,
          },
          {
            name: 'Diner aan tafel',
            description: 'Drie of vier gangen met aangepaste wijnen.',
            from: 55,
            to: 95,
          },
          {
            name: 'Receptie',
            description: 'Hapjes en bubbels voor na de ceremonie.',
            from: 18,
            to: 32,
          },
        ],
      });
      const venue = await provider({
        login: 'locatie',
        contact: 'Bram Claes',
        business: 'Loft Zuiderdok',
        category: 'venues',
        location: 'Antwerpen',
        price: 'PREMIUM',
        description:
          'Een lichte industriële loft aan het water, met dakterras en zicht op de Schelde. Geschikt voor feesten tot 180 gasten, met eigen parking en een volledig uitgeruste keuken voor je cateraar.',
        tags: ['Dakterras', 'Parking', 'Rolstoeltoegankelijk'],
        minGuests: 40,
        maxGuests: 180,
        services: [
          {
            name: 'Zaalhuur voor een dag',
            description: 'Inclusief meubilair, licht en geluid.',
            from: 2200,
            to: 3200,
          },
        ],
      });
      const photographer = await provider({
        login: 'fotograaf',
        contact: 'Lien Maes',
        business: 'Studio Lichtval',
        category: 'photography',
        location: 'Gent',
        price: 'MEDIUM',
        description:
          'Ongedwongen reportages met oog voor de kleine momenten. Ik fotografeer bruiloften, familiefeesten en bedrijfsevents in heel Vlaanderen en lever binnen de drie weken een online galerij.',
        tags: ['Reportage', 'Online galerij', 'Tweede fotograaf mogelijk'],
        services: [
          {
            name: 'Halve dag',
            description: 'Tot vijf uur reportage, 250 bewerkte foto’s.',
            from: 850,
          },
          {
            name: 'Volledige dag',
            description: 'Van voorbereiding tot openingsdans.',
            from: 1500,
            to: 1900,
          },
        ],
      });
      await provider({
        login: 'dj',
        contact: 'Noah Wouters',
        business: 'DJ Noord',
        category: 'dj',
        location: 'Antwerpen',
        price: 'MEDIUM',
        description:
          'Dj met eigen licht- en geluidsinstallatie. Van achtergrondmuziek bij de receptie tot een volle dansvloer: we stemmen de muziek vooraf met jullie af en lezen op de avond zelf de zaal.',
        tags: ['Eigen installatie', 'Verzoeknummers', 'Lichtshow'],
        services: [
          {
            name: 'Avondfeest',
            description: 'Vijf uur muziek, inclusief op- en afbouw.',
            from: 650,
            to: 950,
          },
        ],
      });
      // Waiting for verification, so the admin queue is not empty.
      await provider({
        login: 'bloemist',
        contact: 'Hanne Willems',
        business: 'Bloemen & Zo',
        category: 'flowers',
        location: 'Mechelen',
        price: 'MEDIUM',
        description:
          'Bruidsboeketten, tafelstukken en bloemenbogen met seizoensbloemen van Belgische kwekers. We komen graag ter plaatse kijken om de aankleding af te stemmen op de locatie.',
        tags: ['Seizoensbloemen', 'Bloemenboog'],
        verified: false,
        services: [
          {
            name: 'Bruidsboeket',
            description: 'Op maat, met bijpassende corsages.',
            from: 120,
            to: 220,
          },
        ],
      });

      // ── Emma's wedding: one event, several providers at different stages ──
      const weddingDate = day(150);
      const event = await tx.event.create({
        data: {
          customer_id: customer.id,
          name: 'Bruiloft Emma & Lars',
          event_type: 'WEDDING',
          event_date: weddingDate,
          location: 'Antwerpen',
          guest_count: 120,
          budget_min: 12000,
          budget_max: 18000,
          slots: {
            create: [
              { category: 'VENUE', is_required: true, display_order: 0 },
              { category: 'CATERING', is_required: true, display_order: 1 },
              {
                category: 'PHOTOGRAPHY',
                is_required: true,
                display_order: 2,
                status: 'QUOTES_REQUESTED',
              },
              { category: 'MUSIC', is_required: true, display_order: 3 },
              { category: 'FLOWERS', is_required: false, display_order: 4 },
            ],
          },
        },
        select: { slots: { select: { id: true, category: true } } },
      });
      const slot = (category: string) =>
        event.slots.find((entry) => entry.category === category)!.id;

      const request = (input: {
        customerId: string;
        customerName: string;
        customerEmail: string;
        providerId: string;
        category: string;
        eventType: string;
        date: Date;
        guests: number;
        status: 'PENDING' | 'QUOTED' | 'ACCEPTED';
        description: string;
        createdAt: Date;
      }) =>
        tx.serviceRequest.create({
          data: {
            customer_id: input.customerId,
            provider_id: input.providerId,
            category: input.category,
            event_type: input.eventType,
            event_date: input.date,
            event_location: 'Antwerpen',
            guest_count: input.guests,
            budget_range: 'HIGH',
            description: input.description,
            status: input.status,
            customer_name: input.customerName,
            customer_email: input.customerEmail,
            customer_phone: '+32 470 00 00 01',
            preferred_contact: 'chat',
            created_at: input.createdAt,
          },
          select: { id: true },
        });
      const emma = {
        customerId: customer.id,
        customerName: 'Emma Peeters',
        customerEmail: email('klant'),
      };

      // Venue: quote accepted → booking, slot booked.
      const venueRequest = await request({
        ...emma,
        providerId: venue.id,
        category: 'venues',
        eventType: 'Bruiloft',
        date: weddingDate,
        guests: 120,
        status: 'ACCEPTED',
        description: 'We zoeken een locatie voor ceremonie, diner en avondfeest.',
        createdAt: ago(12),
      });
      const venueQuote = await tx.quote.create({
        data: {
          request_id: venueRequest.id,
          provider_id: venue.id,
          total_price: 2400,
          message: 'Loft met dakterras, volledige dag',
          included_services: [
            'Zaalhuur van 10 tot 02 uur',
            'Meubilair voor 120 gasten',
            'Licht en geluid',
            'Eindschoonmaak',
          ],
          terms: '30% voorschot bij bevestiging. Kosteloos annuleren tot 90 dagen voor het event.',
          valid_until: day(20),
          accepted: true,
          event_slot_id: slot('VENUE'),
          created_at: ago(10),
        },
        select: { id: true },
      });
      await tx.booking.create({
        data: {
          request_id: venueRequest.id,
          customer_id: customer.id,
          provider_id: venue.id,
          event_date: weddingDate,
          event_location: 'Antwerpen',
          guest_count: 120,
          final_price: 2400,
          status: 'CONFIRMED',
          payment_status: 'UNPAID',
          created_at: ago(9),
        },
      });
      await tx.eventSlot.update({
        where: { id: slot('VENUE') },
        data: { status: 'BOOKED', booked_quote_id: venueQuote.id },
      });

      // Catering: quote waiting for Emma's answer.
      const cateringRequest = await request({
        ...emma,
        providerId: caterer.id,
        category: 'catering',
        eventType: 'Bruiloft',
        date: weddingDate,
        guests: 120,
        status: 'QUOTED',
        description: 'Graag een walking dinner voor 120 gasten, met een vegetarisch alternatief.',
        createdAt: ago(4),
      });
      const cateringQuote = await tx.quote.create({
        data: {
          request_id: cateringRequest.id,
          provider_id: caterer.id,
          total_price: 7800,
          message: 'Walking dinner voor 120 gasten',
          included_services: [
            'Acht gerechten per persoon',
            'Vegetarisch alternatief',
            'Bediening (8 personen)',
            'Servies en glaswerk',
          ],
          terms:
            '25% voorschot bij bevestiging. Definitief aantal gasten tot 14 dagen voor het event.',
          valid_until: day(12),
          event_slot_id: slot('CATERING'),
          created_at: ago(2),
        },
        select: { id: true },
      });
      await tx.eventSlot.update({
        where: { id: slot('CATERING') },
        data: { status: 'QUOTES_RECEIVED' },
      });

      // Photography: requested, no quote yet.
      await request({
        ...emma,
        providerId: photographer.id,
        category: 'photography',
        eventType: 'Bruiloft',
        date: weddingDate,
        guests: 120,
        status: 'PENDING',
        description: 'We willen graag een reportage van de voorbereiding tot de openingsdans.',
        createdAt: ago(1),
      });

      // An earlier party with the caterer: completed and reviewed.
      const partyDate = day(-60);
      const partyRequest = await request({
        ...emma,
        providerId: caterer.id,
        category: 'catering',
        eventType: 'Verjaardag',
        date: partyDate,
        guests: 40,
        status: 'ACCEPTED',
        description: 'Verjaardagsfeest thuis, graag hapjes en een dessertbuffet.',
        createdAt: ago(95),
      });
      await tx.quote.create({
        data: {
          request_id: partyRequest.id,
          provider_id: caterer.id,
          total_price: 1450,
          message: 'Receptie en dessertbuffet voor 40 gasten',
          included_services: ['Zes soorten hapjes', 'Dessertbuffet', 'Bediening (2 personen)'],
          terms: 'Standaard voorwaarden van toepassing.',
          valid_until: day(-75),
          accepted: true,
          created_at: ago(92),
        },
      });
      await tx.booking.create({
        data: {
          request_id: partyRequest.id,
          customer_id: customer.id,
          provider_id: caterer.id,
          event_date: partyDate,
          event_location: 'Antwerpen',
          guest_count: 40,
          final_price: 1450,
          status: 'COMPLETED',
          payment_status: 'PAID',
          created_at: ago(90),
        },
      });
      await tx.review.create({
        data: {
          provider_id: caterer.id,
          customer_id: customer.id,
          rating: 5,
          title: 'Iedereen sprak er nog dagen over',
          comment:
            'Heerlijk eten, mooi gepresenteerd en een team dat overal aan dacht. De communicatie vooraf was vlot en op de dag zelf hoefden we nergens naar om te kijken.',
          event_type: 'Verjaardag',
          event_date: partyDate,
          created_at: ago(55),
        },
      });
      await tx.serviceProvider.update({
        where: { id: caterer.id },
        data: { rating_avg: 5, review_count: 1 },
      });

      // A new request from another customer, so the caterer has something to answer.
      await request({
        customerId: secondCustomer.id,
        customerName: 'Tom Janssens',
        customerEmail: email('klant2'),
        providerId: caterer.id,
        category: 'catering',
        eventType: 'Zakelijk event',
        date: day(45),
        guests: 60,
        status: 'PENDING',
        description:
          'Lunch voor een teamdag met 60 collega’s, graag met enkele veganistische opties.',
        createdAt: ago(0, 5),
      });

      await tx.blockedDate.createMany({
        data: [
          { provider_id: caterer.id, date: day(21), reason: 'Vakantie' },
          { provider_id: caterer.id, date: day(22), reason: 'Vakantie' },
        ],
      });

      // ── A conversation between Emma and the caterer, with the quote in it ──
      await tx.conversation.create({
        data: {
          updated_at: ago(1, 20),
          participants: {
            create: [
              { user_id: customer.id, last_read_at: ago(2) },
              { user_id: caterer.userId, last_read_at: ago(1, 20) },
            ],
          },
          messages: {
            create: [
              {
                sender_id: customer.id,
                content:
                  'Dag Sofie, we trouwen volgend jaar en zoeken een cateraar voor 120 gasten. Doen jullie ook walking dinners?',
                created_at: ago(4),
              },
              {
                sender_id: caterer.userId,
                content:
                  'Dag Emma, gefeliciteerd! Zeker, dat is onze specialiteit. Ik stuur je een voorstel met acht gerechten en een vegetarisch alternatief.',
                created_at: ago(3, 20),
              },
              {
                sender_id: caterer.userId,
                content: 'Offerte: € 7.800',
                message_type: 'QUOTE',
                quote_id: cateringQuote.id,
                created_at: ago(2),
              },
              {
                sender_id: caterer.userId,
                content:
                  'Het aantal gasten kun je tot twee weken vooraf nog aanpassen. Laat gerust weten als je vragen hebt.',
                created_at: ago(1, 20),
              },
            ],
          },
        },
      });

      // ── Something for the admin screens ─────────────────────────────────
      await tx.contentReport.create({
        data: {
          reporter_id: secondCustomer.id,
          reporter_email: email('klant2'),
          target_type: 'PROVIDER',
          target_id: photographer.id,
          reason: 'IP',
          details:
            'Voorbeeldmelding: een van de foto’s op dit profiel lijkt van een andere fotograaf te zijn.',
          created_at: ago(1),
        },
      });
      await tx.waitlistEntry.createMany({
        data: [
          {
            type: 'CUSTOMER',
            name: 'Voorbeeld Klant',
            email: email('wachtlijst1'),
            message: 'Wanneer komen jullie naar Limburg?',
          },
          {
            type: 'PROVIDER',
            name: 'Voorbeeld Zaak',
            email: email('wachtlijst2'),
            categories: ['DECORATION', 'FLOWERS'],
          },
        ],
      });
    },
    { timeout: 30_000, maxWait: 10_000 }
  );
}
