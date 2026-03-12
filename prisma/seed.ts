import { PrismaClient, UserRole, PriceRange, ServiceRequestStatus, BookingStatus, EventType, EventStatus, SlotStatus, ProviderCategory } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // Verwijder bestaande data
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.eventSlot.deleteMany();
  await prisma.event.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.providerService.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Deleted existing data');

  // Hash wachtwoord voor demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eventiphy.nl',
      name: 'Admin User',
      password_hash: hashedPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('👤 Created admin user');

  // Create Customer Users
  const customer1 = await prisma.user.create({
    data: {
      email: 'sarah.jansen@example.com',
      name: 'Sarah Jansen',
      password_hash: hashedPassword,
      role: UserRole.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'mark.vandijk@example.com',
      name: 'Mark van Dijk',
      password_hash: hashedPassword,
      role: UserRole.CUSTOMER,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: 'lisa.peters@example.com',
      name: 'Lisa Peters',
      password_hash: hashedPassword,
      role: UserRole.CUSTOMER,
    },
  });

  console.log('👥 Created customer users');

  // Create Provider Users with ServiceProvider profiles
  const provider1User = await prisma.user.create({
    data: {
      email: 'info@culinairecreatiesamsterdam.nl',
      name: 'Culinaire Creaties',
      password_hash: hashedPassword,
      role: UserRole.PROVIDER,
    },
  });

  const provider1 = await prisma.serviceProvider.create({
    data: {
      user_id: provider1User.id,
      business_name: 'Culinaire Creaties',
      category: 'catering',
      location: 'Amsterdam',
      price_range: PriceRange.HIGH,
      description: 'Specialist in exclusieve catering voor bruiloften en zakelijke evenementen. Wij bieden een breed scala aan menu\'s, van traditioneel Nederlands tot internationale fusion.',
      services: ['Buffet', 'Diner', 'Walking dinner', 'Fingerfood', 'Drankservice'],
      images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      ],
      availability: 'Beschikbaar weekends',
      min_guests: 25,
      max_guests: 500,
      response_time: 'Binnen 2 uur',
      verified: true,
      rating_avg: 4.8,
      review_count: 127,
    },
  });

  const provider2User = await prisma.user.create({
    data: {
      email: 'dj@mikeproductions.nl',
      name: 'DJ Mike',
      password_hash: hashedPassword,
      role: UserRole.PROVIDER,
    },
  });

  const provider2 = await prisma.serviceProvider.create({
    data: {
      user_id: provider2User.id,
      business_name: 'DJ Mike Productions',
      category: 'dj',
      location: 'Rotterdam',
      price_range: PriceRange.MEDIUM,
      description: 'Professionele DJ met 15 jaar ervaring in bruiloften, bedrijfsfeesten en privé events. Breed repertoire van dance tot lounge muziek.',
      services: ['DJ set', 'Geluid & Licht', 'MC diensten', 'Playlist op maat'],
      images: [
        'https://images.unsplash.com/photo-1571266028243-d220c6e2e3e5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
      ],
      availability: 'Beschikbaar alle dagen',
      min_guests: 50,
      max_guests: 1000,
      response_time: 'Binnen 1 uur',
      verified: true,
      rating_avg: 4.9,
      review_count: 89,
    },
  });

  const provider3User = await prisma.user.create({
    data: {
      email: 'info@lensandmoments.nl',
      name: 'Lens & Moments',
      password_hash: hashedPassword,
      role: UserRole.PROVIDER,
    },
  });

  const provider3 = await prisma.serviceProvider.create({
    data: {
      user_id: provider3User.id,
      business_name: 'Lens & Moments',
      category: 'photography',
      location: 'Utrecht',
      price_range: PriceRange.HIGH,
      description: 'Award-winning fotografie studio gespecialiseerd in bruiloftsfotografie en event coverage. Creatieve en natuurlijke stijl.',
      services: ['Fotografie', 'Videografie', 'Drone opnames', 'Fotoboek', 'Online gallery'],
      images: [
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      ],
      availability: 'Beschikbaar op aanvraag',
      min_guests: 1,
      max_guests: 500,
      response_time: 'Binnen 3 uur',
      verified: true,
      rating_avg: 5.0,
      review_count: 64,
    },
  });

  const provider4User = await prisma.user.create({
    data: {
      email: 'info@bloemenenstijl.nl',
      name: 'Bloemen & Stijl',
      password_hash: hashedPassword,
      role: UserRole.PROVIDER,
    },
  });

  const provider4 = await prisma.serviceProvider.create({
    data: {
      user_id: provider4User.id,
      business_name: 'Bloemen & Stijl',
      category: 'decoration',
      location: 'Amsterdam',
      price_range: PriceRange.MEDIUM,
      description: 'Complete styling en decoratie voor elk type evenement. Van bloemen tot compleet interieurontwerp.',
      services: ['Bloemstukken', 'Tafeldecoratie', 'Verlichting', 'Styling', 'Opbouw & Afbouw'],
      images: [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=600&fit=crop',
      ],
      availability: 'Beschikbaar alle dagen',
      min_guests: 10,
      max_guests: 500,
      response_time: 'Binnen 4 uur',
      verified: true,
      rating_avg: 4.7,
      review_count: 112,
    },
  });

  console.log('🏢 Created service providers');

  // Create Service Requests
  const request1 = await prisma.serviceRequest.create({
    data: {
      customer_id: customer1.id,
      provider_id: provider1.id,
      category: 'catering',
      event_type: 'Bruiloft',
      event_date: new Date('2024-08-15'),
      event_location: 'Amsterdam',
      guest_count: 120,
      budget_range: PriceRange.HIGH,
      description: 'We zoeken een caterer voor onze bruiloft met 120 gasten. We willen graag een 3-gangen diner met vegetarische opties.',
      status: ServiceRequestStatus.QUOTED,
      customer_name: 'Sarah Jansen',
      customer_email: 'sarah.jansen@example.com',
      customer_phone: '+31612345678',
      preferred_contact: 'email',
    },
  });

  const request2 = await prisma.serviceRequest.create({
    data: {
      customer_id: customer2.id,
      provider_id: provider2.id,
      category: 'dj',
      event_type: 'Bedrijfsfeest',
      event_date: new Date('2024-12-20'),
      event_location: 'Rotterdam',
      guest_count: 80,
      budget_range: PriceRange.MEDIUM,
      description: 'DJ gezocht voor ons kerstfeest. Mix van populaire hits en lounge muziek.',
      status: ServiceRequestStatus.PENDING,
      customer_name: 'Mark van Dijk',
      customer_email: 'mark.vandijk@example.com',
      customer_phone: '+31687654321',
      preferred_contact: 'phone',
    },
  });

  const request3 = await prisma.serviceRequest.create({
    data: {
      customer_id: customer3.id,
      category: 'photography',
      event_type: 'Verjaardag',
      event_date: new Date('2024-09-10'),
      event_location: 'Utrecht',
      guest_count: 50,
      budget_range: PriceRange.MEDIUM,
      description: 'Fotograaf voor 50e verjaardag. 4 uur fotografie gewenst.',
      status: ServiceRequestStatus.PENDING,
      customer_name: 'Lisa Peters',
      customer_email: 'lisa.peters@example.com',
      customer_phone: '+31698765432',
      preferred_contact: 'email',
    },
  });

  console.log('📋 Created service requests');

  // Create Quotes
  const quote1 = await prisma.quote.create({
    data: {
      request_id: request1.id,
      provider_id: provider1.id,
      total_price: 4500.00,
      included_services: ['3-gangen diner', 'Vegetarische opties', 'Bediening', 'Tafeldecoratie', 'Drankservice'],
      terms: 'Inclusief opstelling en afruimen. 50% aanbetaling vereist.',
      valid_until: new Date('2024-07-15'),
      message: 'Graag stel ik een uitgebreid menu voor jullie samen. Laten we een proeverij inplannen!',
      accepted: false,
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      request_id: request2.id,
      provider_id: provider2.id,
      total_price: 1200.00,
      included_services: ['DJ set 4 uur', 'Professionele geluidsinstallatie', 'Sfeerverlichting', 'MC diensten'],
      terms: 'Inclusief reiskosten binnen 50km. Setup 1 uur voor aanvang.',
      valid_until: new Date('2024-11-20'),
      message: 'Ik kan jullie een geweldige avond bezorgen! Laten we de muziekvoorkeuren bespreken.',
      accepted: false,
    },
  });

  console.log('💰 Created quotes');

  // Create a Booking
  const booking1 = await prisma.booking.create({
    data: {
      request_id: request1.id,
      customer_id: customer1.id,
      provider_id: provider1.id,
      event_date: new Date('2024-08-15'),
      event_location: 'Amsterdam',
      guest_count: 120,
      final_price: 4500.00,
      status: BookingStatus.CONFIRMED,
      payment_status: 'Aanbetaling ontvangen',
      special_requests: 'Extra vegetarische opties graag',
    },
  });

  console.log('📅 Created bookings');

  // Create Reviews
  const review1 = await prisma.review.create({
    data: {
      provider_id: provider1.id,
      customer_id: customer1.id,
      rating: 5,
      title: 'Fantastische catering voor onze bruiloft!',
      comment: 'Het eten was absoluut heerlijk en prachtig gepresenteerd. Alle gasten waren onder de indruk. Het team was professioneel en flexibel. Aanrader!',
      event_type: 'Bruiloft',
      event_date: new Date('2024-06-15'),
    },
  });

  const review2 = await prisma.review.create({
    data: {
      provider_id: provider2.id,
      customer_id: customer2.id,
      rating: 5,
      title: 'Beste DJ ever!',
      comment: 'Mike heeft ons feest tot een geweldig succes gemaakt. Perfect gevoel voor sfeer en timing. Iedereen heeft de hele avond gedanst!',
      event_type: 'Bedrijfsfeest',
      event_date: new Date('2024-07-22'),
    },
  });

  const review3 = await prisma.review.create({
    data: {
      provider_id: provider3.id,
      customer_id: customer3.id,
      rating: 5,
      title: 'Prachtige foto\'s!',
      comment: 'De foto\'s zijn echt prachtig geworden. Hele dag onopvallend en professioneel gewerkt. Snelle levering van de foto\'s.',
      event_type: 'Verjaardag',
      event_date: new Date('2024-05-10'),
    },
  });

  console.log('⭐ Created reviews');

  // ========================================
  // 🎪 EVENTS voor Sarah Jansen
  // ========================================

  // Event 1: Sarah's bruiloft
  const event1 = await prisma.event.create({
    data: {
      customer_id: customer1.id,
      name: 'Bruiloft Sarah & Thomas',
      event_type: EventType.WEDDING,
      event_date: new Date('2026-08-15'),
      location: 'Kasteel De Haar, Utrecht',
      guest_count: 120,
      budget_min: 15000,
      budget_max: 25000,
      status: EventStatus.PLANNING,
    },
  });

  // Event 2: Sarah's verjaardagsfeest
  const event2 = await prisma.event.create({
    data: {
      customer_id: customer1.id,
      name: 'Verjaardag Sarah - 30 jaar!',
      event_type: EventType.BIRTHDAY,
      event_date: new Date('2026-05-20'),
      location: 'Restaurant De Kas, Amsterdam',
      guest_count: 50,
      budget_min: 3000,
      budget_max: 6000,
      status: EventStatus.ACTIVE,
    },
  });

  // Event 3: Sarah's bedrijfsevenement
  const event3 = await prisma.event.create({
    data: {
      customer_id: customer1.id,
      name: 'Zomerevent Jansen Consultancy',
      event_type: EventType.CORPORATE,
      event_date: new Date('2026-07-10'),
      location: 'Westergasfabriek, Amsterdam',
      guest_count: 200,
      budget_min: 10000,
      budget_max: 18000,
      status: EventStatus.PLANNING,
    },
  });

  console.log('🎪 Created events for Sarah');

  // ========================================
  // 🎰 EVENT SLOTS
  // ========================================

  // Slots voor Bruiloft
  const slot_wedding_catering = await prisma.eventSlot.create({
    data: {
      event_id: event1.id,
      category: ProviderCategory.CATERING,
      is_required: true,
      display_order: 1,
      status: SlotStatus.QUOTES_RECEIVED,
    },
  });

  const slot_wedding_music = await prisma.eventSlot.create({
    data: {
      event_id: event1.id,
      category: ProviderCategory.MUSIC,
      is_required: true,
      display_order: 2,
      status: SlotStatus.QUOTES_REQUESTED,
    },
  });

  const slot_wedding_photo = await prisma.eventSlot.create({
    data: {
      event_id: event1.id,
      category: ProviderCategory.PHOTOGRAPHY,
      is_required: true,
      display_order: 3,
      status: SlotStatus.SEARCHING,
    },
  });

  const slot_wedding_flowers = await prisma.eventSlot.create({
    data: {
      event_id: event1.id,
      category: ProviderCategory.FLOWERS,
      is_required: true,
      display_order: 4,
      status: SlotStatus.QUOTES_REQUESTED,
    },
  });

  const slot_wedding_decoration = await prisma.eventSlot.create({
    data: {
      event_id: event1.id,
      category: ProviderCategory.DECORATION,
      is_required: false,
      display_order: 5,
      status: SlotStatus.EMPTY,
    },
  });

  const slot_wedding_cake = await prisma.eventSlot.create({
    data: {
      event_id: event1.id,
      category: ProviderCategory.CAKE,
      is_required: false,
      display_order: 6,
      status: SlotStatus.EMPTY,
    },
  });

  // Slots voor Verjaardag
  const slot_birthday_catering = await prisma.eventSlot.create({
    data: {
      event_id: event2.id,
      category: ProviderCategory.CATERING,
      is_required: true,
      display_order: 1,
      status: SlotStatus.BOOKED,
    },
  });

  const slot_birthday_entertainment = await prisma.eventSlot.create({
    data: {
      event_id: event2.id,
      category: ProviderCategory.ENTERTAINMENT,
      is_required: false,
      display_order: 2,
      status: SlotStatus.SEARCHING,
    },
  });

  const slot_birthday_photo = await prisma.eventSlot.create({
    data: {
      event_id: event2.id,
      category: ProviderCategory.PHOTOGRAPHY,
      is_required: false,
      display_order: 3,
      status: SlotStatus.EMPTY,
    },
  });

  // Slots voor Bedrijfsevent
  const slot_corporate_catering = await prisma.eventSlot.create({
    data: {
      event_id: event3.id,
      category: ProviderCategory.CATERING,
      is_required: true,
      display_order: 1,
      status: SlotStatus.QUOTES_RECEIVED,
    },
  });

  const slot_corporate_music = await prisma.eventSlot.create({
    data: {
      event_id: event3.id,
      category: ProviderCategory.MUSIC,
      is_required: true,
      display_order: 2,
      status: SlotStatus.EMPTY,
    },
  });

  const slot_corporate_venue = await prisma.eventSlot.create({
    data: {
      event_id: event3.id,
      category: ProviderCategory.VENUE,
      is_required: true,
      display_order: 3,
      status: SlotStatus.BOOKED,
    },
  });

  console.log('🎰 Created event slots');

  // ========================================
  // 📋 EXTRA SERVICE REQUESTS Sarah ↔ Culinaire Creaties
  // ========================================

  // Request voor verjaardag catering
  const request4 = await prisma.serviceRequest.create({
    data: {
      customer_id: customer1.id,
      provider_id: provider1.id,
      category: 'catering',
      event_type: 'Verjaardag',
      event_date: new Date('2026-05-20'),
      event_location: 'Restaurant De Kas, Amsterdam',
      guest_count: 50,
      budget_range: PriceRange.MEDIUM,
      description: 'Ik zoek een walking dinner voor mijn 30e verjaardag. Graag een mix van vlees, vis en vegetarische hapjes. Eventueel ook een cocktailservice.',
      status: ServiceRequestStatus.ACCEPTED,
      customer_name: 'Sarah Jansen',
      customer_email: 'sarah.jansen@example.com',
      customer_phone: '+31612345678',
      preferred_contact: 'email',
    },
  });

  // Request voor bedrijfsevenement catering
  const request5 = await prisma.serviceRequest.create({
    data: {
      customer_id: customer1.id,
      provider_id: provider1.id,
      category: 'catering',
      event_type: 'Bedrijfsevenement',
      event_date: new Date('2026-07-10'),
      event_location: 'Westergasfabriek, Amsterdam',
      guest_count: 200,
      budget_range: PriceRange.HIGH,
      description: 'Groot zomerevent voor onze medewerkers. We willen BBQ-style catering met internationale gerechten, vegetarische & veganistische opties. Inclusief drankservice.',
      status: ServiceRequestStatus.QUOTED,
      customer_name: 'Sarah Jansen',
      customer_email: 'sarah.jansen@example.com',
      customer_phone: '+31612345678',
      preferred_contact: 'email',
    },
  });

  // Request voor bruiloft catering (aparte request naast booking)
  const request6 = await prisma.serviceRequest.create({
    data: {
      customer_id: customer1.id,
      provider_id: provider1.id,
      category: 'catering',
      event_type: 'Bruiloft',
      event_date: new Date('2026-08-15'),
      event_location: 'Kasteel De Haar, Utrecht',
      guest_count: 120,
      budget_range: PriceRange.HIGH,
      description: 'Uitgebreide bruiloftscatering voor 120 gasten. 5-gangen diner, amuses tijdens borrel, late night snacks. Graag lokale en seizoensgebonden producten.',
      status: ServiceRequestStatus.QUOTED,
      customer_name: 'Sarah Jansen',
      customer_email: 'sarah.jansen@example.com',
      customer_phone: '+31612345678',
      preferred_contact: 'email',
    },
  });

  console.log('📋 Created extra service requests');

  // ========================================
  // 💰 EXTRA QUOTES van Culinaire Creaties
  // ========================================

  // Quote voor verjaardag
  const quote3 = await prisma.quote.create({
    data: {
      request_id: request4.id,
      provider_id: provider1.id,
      total_price: 2750.00,
      included_services: [
        'Walking dinner 8 gerechten',
        'Cocktailservice (2 signature cocktails)',
        'Bediening (3 personen)',
        'Vegetarische & vis opties',
        'Opstelling en afruimen',
      ],
      terms: 'Prijs is exclusief dranken. 30% aanbetaling bij bevestiging. Annulering tot 2 weken voor datum kosteloos.',
      valid_until: new Date('2026-04-20'),
      message: 'Wat een leuk feest wordt dat! Voor een walking dinner met 50 gasten stel ik dit pakket voor. De cocktailservice geeft echt een feestelijk tintje. Zullen we een proeverij inplannen?',
      accepted: true,
      event_slot_id: slot_birthday_catering.id,
    },
  });

  // Quote voor bedrijfsevenement
  const quote4 = await prisma.quote.create({
    data: {
      request_id: request5.id,
      provider_id: provider1.id,
      total_price: 8900.00,
      included_services: [
        'BBQ live cooking stations (3 stations)',
        'Internationale gerechten buffet',
        'Vegetarisch & veganistisch station',
        'Salade- en broodbar',
        'Drankservice (bier, wijn, fris)',
        'Bediening (8 personen)',
        'Opstelling, afruimen & afval',
      ],
      terms: 'Prijs exclusief eventuele extra dranken. 40% aanbetaling, rest 1 week voor event. Inclusief servies en bestek.',
      valid_until: new Date('2026-06-10'),
      message: 'Wat een gaaf event! Voor 200 gasten adviseer ik 3 live cooking stations, zodat gasten het eten vers bereid zien worden. Dit geeft een leuke beleving. Het vega/vegan station is een apart station zodat dit goed herkenbaar is.',
      accepted: false,
      event_slot_id: slot_corporate_catering.id,
    },
  });

  // Quote voor bruiloft (nieuw, uitgebreider)
  const quote5 = await prisma.quote.create({
    data: {
      request_id: request6.id,
      provider_id: provider1.id,
      total_price: 7850.00,
      included_services: [
        '5-gangen bruiloftsdiner',
        'Amuses tijdens borrel (6 soorten)',
        'Late night snacks',
        'Taart-service',
        'Bediening (6 personen)',
        'Sommelier-service',
        'Lokale & seizoensgebonden ingrediënten',
        'Proefmenu (2 personen)',
      ],
      terms: 'Inclusief proefmenu voor bruidspaar. 50% aanbetaling, rest 2 weken voor de bruiloft. Dieetwensen tot 1 week van tevoren doorgeven.',
      valid_until: new Date('2026-07-15'),
      message: 'Gefeliciteerd met jullie aanstaande bruiloft! Ik heb een prachtig 5-gangen menu samengesteld met lokale producten. Het proefmenu is inclusief, zodat jullie alles kunnen proeven voordat jullie definitief kiezen. Ik kijk ernaar uit om deze bijzondere dag culinair onvergetelijk te maken!',
      accepted: false,
      event_slot_id: slot_wedding_catering.id,
    },
  });

  // Tweede alternatieve quote voor de bruiloft (ander pakket)
  const quote6 = await prisma.quote.create({
    data: {
      request_id: request6.id,
      provider_id: provider1.id,
      total_price: 5200.00,
      included_services: [
        '3-gangen bruiloftsdiner',
        'Amuses tijdens borrel (4 soorten)',
        'Bediening (4 personen)',
        'Seizoensgebonden ingrediënten',
        'Proefmenu (2 personen)',
      ],
      terms: 'Inclusief proefmenu voor bruidspaar. 50% aanbetaling. Exclusief dranken en taart.',
      valid_until: new Date('2026-07-15'),
      message: 'Als jullie iets budgetvriendelijker willen, bied ik ook dit pakket aan. Minder uitgebreid maar met dezelfde kwaliteit en zorg. Jullie kunnen altijd later upgraden!',
      accepted: false,
    },
  });

  console.log('💰 Created extra quotes');

  // Update slot_birthday_catering met booked_quote_id
  await prisma.eventSlot.update({
    where: { id: slot_birthday_catering.id },
    data: { booked_quote_id: quote3.id },
  });

  // ========================================
  // 📅 EXTRA BOOKINGS
  // ========================================

  // Booking voor verjaardag
  const booking2 = await prisma.booking.create({
    data: {
      request_id: request4.id,
      customer_id: customer1.id,
      provider_id: provider1.id,
      event_date: new Date('2026-05-20'),
      event_location: 'Restaurant De Kas, Amsterdam',
      guest_count: 50,
      final_price: 2750.00,
      status: BookingStatus.CONFIRMED,
      payment_status: 'Aanbetaling ontvangen',
      special_requests: 'Eén gast heeft een notenallergie. Graag een apart bord voor de jarige.',
    },
  });

  console.log('📅 Created extra bookings');

  // ========================================
  // ⭐ EXTRA REVIEWS Sarah → Culinaire Creaties
  // ========================================

  // Eerdere review van Sarah (naast de bestaande review1)
  const review4 = await prisma.review.create({
    data: {
      provider_id: provider1.id,
      customer_id: customer1.id,
      rating: 4,
      title: 'Heerlijk bedrijfslunch',
      comment: 'We hadden Culinaire Creaties ingehuurd voor een zakelijke lunch met 30 gasten. Het eten was heerlijk en mooi gepresenteerd. Enige minpuntje was dat de salade iets laat klaarstond, maar verder top! De vegetarische opties waren echt verrassend goed.',
      event_type: 'Bedrijfsevenement',
      event_date: new Date('2025-11-05'),
    },
  });

  const review5 = await prisma.review.create({
    data: {
      provider_id: provider1.id,
      customer_id: customer1.id,
      rating: 5,
      title: 'Elke keer weer genieten!',
      comment: 'Dit is inmiddels de derde keer dat ik Culinaire Creaties boek en ze stellen nooit teleur. Voor mijn moeder haar 60e verjaardag hebben ze een prachtig 4-gangen menu verzorgd. Communicatie is altijd snel en vriendelijk, en het team is super flexibel. Absolute aanrader!',
      event_type: 'Verjaardag',
      event_date: new Date('2026-01-18'),
    },
  });

  console.log('⭐ Created extra reviews');

  // ========================================
  // 💬 UITGEBREIDE CONVERSATIONS & MESSAGES
  // ========================================

  // Conversatie 1: Algemeen contact Sarah ↔ Culinaire Creaties (uitgebreid)
  const conversation1 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { user_id: customer1.id },
          { user_id: provider1User.id },
        ],
      },
    },
  });

  // Berichten verspreid over tijd - Eerste contact
  const msgs1 = [
    {
      sender_id: customer1.id,
      content: 'Hallo! Ik ben Sarah Jansen. Ik heb jullie gevonden via Eventify en ben erg onder de indruk van jullie portfolio. Ik ben op zoek naar catering voor meerdere evenementen dit jaar.',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T10:30:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Hallo Sarah! Wat leuk dat je ons hebt gevonden. Bedankt voor het compliment! Vertel eens, wat voor evenementen heb je in gedachten?',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T11:15:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Allereerst word ik 30 in mei, daar wil ik een walking dinner voor organiseren. En in augustus trouw ik! 🎉 Dus ik zoek voor beide gelegenheden catering.',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T11:22:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Oh wat leuk, gefeliciteerd alvast met allebei! 🎂💒 Een walking dinner en een bruiloftsdiner, dat zijn twee heel verschillende dingen maar allebei onze specialiteit. Hoeveel gasten verwacht je bij elk evenement?',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T11:28:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Voor mijn verjaardag denk ik aan zo\'n 50 gasten, en voor de bruiloft worden het er rond de 120. De bruiloft is op Kasteel De Haar in Utrecht.',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T11:35:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Kasteel De Haar, prachtige locatie! Daar hebben we vaker gecaterd. Het is een fantastische setting voor een bruiloftsdiner. Laat me een offerte opstellen voor beide evenementen. Heb je al specifieke wensen qua menu?',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T11:45:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Voor de verjaardag wil ik iets luchtig en feestelijks - walking dinner met een mix van hapjes. Misschien ook een cocktailservice? Voor de bruiloft wil ik echt uitpakken: een 5-gangen diner met lokale ingrediënten. Mijn verloofde Thomas is echt een foodie 😄',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T12:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Dat klinkt geweldig! Ik ga aan de slag met de offertes. Voor het 5-gangen diner zou ik graag een proefmenu organiseren - zo kunnen jullie alles rustig proeven voordat jullie kiezen. Hebben jullie dieetwensen of allergieën waar ik rekening mee moet houden?',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T12:10:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Super, het proefmenu klinkt fantastisch! Thomas en ik zijn er helemaal voor. Qua allergieën: Thomas\' moeder is glutenintolerant en een paar gasten zijn vegetarisch. Verder geen bijzonderheden.',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T12:20:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Geen probleem, we hebben ruime ervaring met glutenvrije en vegetarische gerechten. Ik stuur de offertes vandaag nog je kant op. Tot snel! 😊',
      message_type: 'TEXT' as const,
      conversation_id: conversation1.id,
      created_at: new Date('2026-01-15T12:30:00'),
    },
  ];

  for (const msg of msgs1) {
    await prisma.message.create({ data: msg });
  }

  // Conversatie 2: Over de verjaardag offerte
  const conversation2 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { user_id: customer1.id },
          { user_id: provider1User.id },
        ],
      },
    },
  });

  const msgs2 = [
    {
      sender_id: provider1User.id,
      content: 'Hi Sarah! Ik heb de offerte voor je verjaardag klaarstaan. Even een samenvatting: walking dinner met 8 gerechten, cocktailservice met 2 signature cocktails, 3 man bediening. Totaal €2.750.',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-18T09:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Ik heb de officiële offerte via het systeem verstuurd, maar wilde even persoonlijk toelichten.',
      message_type: 'SYSTEM' as const,
      conversation_id: conversation2.id,
      quote_id: quote3.id,
      created_at: new Date('2026-01-18T09:01:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Dankjewel! Ik heb de offerte bekeken en het ziet er heel goed uit. De cocktailservice is een super idee! Welke signature cocktails stellen jullie voor?',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-18T10:30:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Ik dacht aan een Espresso Martini (altijd een hit op feesten!) en een huisgemaakte Limoncello Spritz met verse kruiden. Maar we kunnen ook iets compleet op maat maken als je iets anders in gedachten hebt!',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-18T10:45:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Oeh de Limoncello Spritz klinkt heerlijk! En de Espresso Martini is inderdaad een classic. Ik ben akkoord met de offerte! 🎉',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-18T11:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Top! Dan zet ik alles in gang. Ik stuur je volgende week de bevestiging en de factuur voor de aanbetaling. We gaan er een fantastisch feest van maken! 🥳',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-18T11:10:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Ik heb nog een vraagje: één vriendin heeft een notenallergie. Kan daar rekening mee gehouden worden?',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-20T14:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Absoluut, we werken standaard met een allergieprotocol. Ik noteer de notenallergie en zorg dat alle gerechten veilig zijn. Als er nog meer allergieën zijn, kun je die tot 1 week voor het feest doorgeven.',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-20T14:30:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Perfect, dankjewel! Jullie zijn echt een aanrader. Ik kijk er zo naar uit! 😍',
      message_type: 'TEXT' as const,
      conversation_id: conversation2.id,
      created_at: new Date('2026-01-20T14:45:00'),
    },
  ];

  for (const msg of msgs2) {
    await prisma.message.create({ data: msg });
  }

  // Conversatie 3: Over de bruiloft offerte
  const conversation3 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { user_id: customer1.id },
          { user_id: provider1User.id },
        ],
      },
    },
  });

  const msgs3 = [
    {
      sender_id: provider1User.id,
      content: 'Hoi Sarah! De offertes voor de bruiloftscatering zijn klaar. Ik heb twee opties gemaakt: een uitgebreid 5-gangen pakket (€7.850) en een budgetvriendelijker 3-gangen pakket (€5.200). Beide inclusief proefmenu voor jullie.',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-01T10:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Hier is de uitgebreide offerte met het 5-gangen menu:',
      message_type: 'QUOTE' as const,
      conversation_id: conversation3.id,
      quote_id: quote5.id,
      created_at: new Date('2026-02-01T10:01:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'En hier het alternatieve pakket:',
      message_type: 'QUOTE' as const,
      conversation_id: conversation3.id,
      quote_id: quote6.id,
      created_at: new Date('2026-02-01T10:02:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Wauw, wat uitgebreid! Thomas en ik gaan dit weekend alles goed doornemen. Het 5-gangen pakket spreekt ons wel het meest aan eerlijk gezegd. De late night snacks zijn een geweldig idee!',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-01T14:30:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Neem gerust de tijd! En als jullie ergens tussen in zitten, kunnen we altijd een maatwerkpakket samenstellen. De late night snacks zijn inderdaad altijd een hit - denk aan mini burgers, truffle fries en zoete broodjes 😋',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-01T15:00:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Thomas is helemaal enthousiast over de truffle fries 😂 We hebben een vraag: is het mogelijk om een amuse met oesters toe te voegen bij de borrel?',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-05T19:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Oesters zijn een prachtige toevoeging! Ik kan verse Zeeuwse oesters serveren met een champagne-mignonette. Voor 120 gasten (we rekenen dat ca. 60% oesters eet) zou dat een meerprijs van €480 zijn. Zal ik dat toevoegen?',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-05T20:15:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Ja, graag! Dat wordt echt een prachtig begin van de avond. Wanneer kunnen we het proefmenu inplannen?',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-05T20:30:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Ik heb in maart nog beschikbaarheid op de 14e, 21e of 28e. Het proefmenu duurt ongeveer 2,5 uur en is bij ons in de proeflokaal in Amsterdam-Zuid. Welke datum past jullie het beste?',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-06T09:00:00'),
    },
    {
      sender_id: customer1.id,
      content: 'De 21e maart past perfect! Thomas heeft dan ook vrij. Hoe laat kunnen we langskomen?',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-06T09:30:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Geweldig! Laten we 18:00 uur afspreken op 21 maart. Ons adres is Apollolaan 42, Amsterdam-Zuid. Ik stuur nog een bevestiging per mail met alle details. Tot dan! 👨‍🍳',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-06T09:45:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Staat in de agenda! We kijken ernaar uit. Dankjewel voor de snelle communicatie, altijd fijn! 😊',
      message_type: 'TEXT' as const,
      conversation_id: conversation3.id,
      created_at: new Date('2026-02-06T10:00:00'),
    },
  ];

  for (const msg of msgs3) {
    await prisma.message.create({ data: msg });
  }

  // Conversatie 4: Over het bedrijfsevenement
  const conversation4 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { user_id: customer1.id },
          { user_id: provider1User.id },
        ],
      },
    },
  });

  const msgs4 = [
    {
      sender_id: customer1.id,
      content: 'Hoi! Ik heb nóg een aanvraag 😄 Mijn bedrijf Jansen Consultancy organiseert in juli een groot zomerevent. 200 medewerkers, buiten bij de Westergasfabriek. Zijn jullie beschikbaar op 10 juli?',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-20T11:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Haha Sarah, je bent onze favoriete klant aan het worden! 😄 10 juli is beschikbaar. Westergasfabriek buitenterrein is trouwens een fantastische locatie voor een BBQ-event. Wat voor sfeer zoek je?',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-20T11:30:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Precies, we willen BBQ-style maar dan met een internationale twist. Live cooking stations, dat vinden onze medewerkers altijd geweldig. En heel belangrijk: goede vegetarische en veganistische opties. We hebben een diverse groep.',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-20T11:45:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Ik denk aan 3 live cooking stations: 1) Argentijnse BBQ, 2) Aziatische wok & steamer, 3) Vegan & vegetarisch station met gegrilde groenten en beyond burgers. Plus een salade- en broodbar. Wat denk je?',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-20T12:00:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Dat klinkt PERFECT! 🔥 De Aziatische wok is een super idee. En het apart vegan station is slim, dan weten mensen gelijk waar ze moeten zijn. Kan er ook een dessertstation bij?',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-20T12:15:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Een dessertstation kan zeker! Ik denk aan een ijsbar met vers fruit en toppings, samen met mini-desserts. Dat past mooi bij de zomerse sfeer. Ik werk de offerte uit en stuur die deze week nog.',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-20T12:30:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Hier is de offerte voor het zomerevent:',
      message_type: 'QUOTE' as const,
      conversation_id: conversation4.id,
      quote_id: quote4.id,
      created_at: new Date('2026-02-22T10:00:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Super, ik heb het doorgestuurd naar mijn collega die het budget beheert. Ik verwacht volgende week antwoord. Nog even over de drankservice: is het mogelijk om lokale craft bieren toe te voegen? We willen het echt speciaal maken.',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-22T14:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Absoluut! Ik werk samen met een aantal Amsterdamse brouwerijen. Ik kan 3-4 lokale craft bieren aanbieden als upgrade. Dat zou een meerprijs van ca. €350 zijn. Laat maar weten als je collega groen licht geeft! 🍺',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-22T14:30:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Klinkt goed! Ik laat het weten zodra ik bericht heb. Bedankt weer voor het meedenken!',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-02-22T15:00:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Goed nieuws! Budget is goedgekeurd 🎉 Inclusief de craft bieren. Kunnen we een planning opstellen voor de opbouw?',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-03-05T09:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Fantastisch! Ik stel voor dat we 9 juli \'s middags opbouwen. Dan hebben we alles rustig klaar voor de volgende dag. Ik stuur een gedetailleerde planning. En Sarah... drie events bij ons, ik denk dat een korting op z\'n plek is 😉 Ik pas de offerte aan met 5% trouweklant-korting!',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-03-05T09:30:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Ahh wat lief! Dat hoeft helemaal niet hoor, maar ik zeg geen nee 😂 Jullie zijn echt top. Dit wordt een geweldige zomer!',
      message_type: 'TEXT' as const,
      conversation_id: conversation4.id,
      created_at: new Date('2026-03-05T10:00:00'),
    },
  ];

  for (const msg of msgs4) {
    await prisma.message.create({ data: msg });
  }

  // Conversatie 5: Na het proefmenu (recent)
  const conversation5 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { user_id: customer1.id },
          { user_id: provider1User.id },
        ],
      },
    },
  });

  const msgs5 = [
    {
      sender_id: customer1.id,
      content: 'WOW! Het proefmenu gisteravond was ONGELOOFLIJK! 🤩 Thomas en ik zijn nog steeds aan het nagenieten. Die risotto met truffel was hemels.',
      message_type: 'TEXT' as const,
      conversation_id: conversation5.id,
      created_at: new Date('2026-03-10T10:00:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Wat fijn om te horen! Het was ook gezellig met jullie. Thomas\' gezicht bij het dessert was geweldig 😄 Zijn er nog wijzigingen die jullie willen in het menu?',
      message_type: 'TEXT' as const,
      conversation_id: conversation5.id,
      created_at: new Date('2026-03-10T10:30:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Het enige wat we zouden willen aanpassen is het voorgerecht: kunnen we in plaats van de gamba\'s de coquilles nemen? Die waren echt spectaculair.',
      message_type: 'TEXT' as const,
      conversation_id: conversation5.id,
      created_at: new Date('2026-03-10T10:45:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Natuurlijk! De Sint-Jakobsschelpen met bloemkoolcrème en hazelnoot - goede keuze! Dat pas ik aan in het menu. Verder alles goed? Ik begin dan met de definitieve voorbereidingen.',
      message_type: 'TEXT' as const,
      conversation_id: conversation5.id,
      created_at: new Date('2026-03-10T11:00:00'),
    },
    {
      sender_id: customer1.id,
      content: 'Verder alles perfect! We zijn zo blij dat we jullie hebben gevonden. Ik heb trouwens al 3 vriendinnen jullie doorgestuurd die ook gaan trouwen dit jaar 😊',
      message_type: 'TEXT' as const,
      conversation_id: conversation5.id,
      created_at: new Date('2026-03-10T11:15:00'),
    },
    {
      sender_id: provider1User.id,
      content: 'Dat is het mooiste compliment dat we kunnen krijgen! Dankjewel Sarah. We gaan er een bruiloft van maken die jullie nooit vergeten. Tot snel! 💐',
      message_type: 'TEXT' as const,
      conversation_id: conversation5.id,
      created_at: new Date('2026-03-10T11:30:00'),
    },
  ];

  for (const msg of msgs5) {
    await prisma.message.create({ data: msg });
  }

  console.log('💬 Created extended conversations & messages');

  // ========================================
  // 🏢 PROVIDER SERVICES voor Culinaire Creaties
  // ========================================

  await prisma.providerService.createMany({
    data: [
      {
        provider_id: provider1.id,
        name: 'Walking Dinner',
        description: 'Sfeervol walking dinner met 6-10 gerechten. Gasten lopen vrij rond terwijl hapjes worden geserveerd.',
        price_from: 45,
        price_to: 75,
      },
      {
        provider_id: provider1.id,
        name: '3-Gangen Diner',
        description: 'Klassiek 3-gangen diner met seizoensgebonden ingrediënten.',
        price_from: 35,
        price_to: 55,
      },
      {
        provider_id: provider1.id,
        name: '5-Gangen Diner',
        description: 'Uitgebreid 5-gangen diner voor bijzondere gelegenheden. Inclusief amuses.',
        price_from: 55,
        price_to: 95,
      },
      {
        provider_id: provider1.id,
        name: 'BBQ Catering',
        description: 'Live BBQ cooking stations met internationale gerechten.',
        price_from: 35,
        price_to: 65,
      },
      {
        provider_id: provider1.id,
        name: 'Cocktailservice',
        description: 'Professionele barservice met signature cocktails, mocktails en klassiekers.',
        price_from: 15,
        price_to: 25,
      },
      {
        provider_id: provider1.id,
        name: 'Bruiloftscatering Compleet',
        description: 'All-inclusive bruiloftscatering: borrel, diner, taart en late night snacks.',
        price_from: 65,
        price_to: 120,
      },
    ],
  });

  console.log('🏢 Created provider services');

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Service Providers: ${await prisma.serviceProvider.count()}`);
  console.log(`- Service Requests: ${await prisma.serviceRequest.count()}`);
  console.log(`- Quotes: ${await prisma.quote.count()}`);
  console.log(`- Bookings: ${await prisma.booking.count()}`);
  console.log(`- Reviews: ${await prisma.review.count()}`);
  console.log(`- Events: ${await prisma.event.count()}`);
  console.log(`- Event Slots: ${await prisma.eventSlot.count()}`);
  console.log(`- Messages: ${await prisma.message.count()}`);
  console.log(`- Conversations: ${await prisma.conversation.count()}`);
  console.log(`- Provider Services: ${await prisma.providerService.count()}`);
  console.log('\n🔐 Test Credentials:');
  console.log('Admin: admin@eventiphy.nl / password123');
  console.log('Customer: sarah.jansen@example.com / password123');
  console.log('Provider: info@culinairecreatiesamsterdam.nl / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
