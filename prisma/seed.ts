import { PrismaClient, UserRole, PriceRange, ServiceRequestStatus, BookingStatus } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // Verwijder bestaande data
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.serviceRequest.deleteMany();
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

  // Create Messages
  await prisma.message.create({
    data: {
      sender_id: customer1.id,
      receiver_id: provider1User.id,
      subject: 'Vraag over menu opties',
      content: 'Hallo, kunnen jullie ook glutenvrije opties aanbieden?',
      read: true,
    },
  });

  await prisma.message.create({
    data: {
      sender_id: provider1User.id,
      receiver_id: customer1.id,
      subject: 'Re: Vraag over menu opties',
      content: 'Ja zeker! We hebben ruime ervaring met glutenvrije catering. Laten we dit bespreken bij de proeverij.',
      read: false,
    },
  });

  console.log('💬 Created messages');

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Service Providers: ${await prisma.serviceProvider.count()}`);
  console.log(`- Service Requests: ${await prisma.serviceRequest.count()}`);
  console.log(`- Quotes: ${await prisma.quote.count()}`);
  console.log(`- Bookings: ${await prisma.booking.count()}`);
  console.log(`- Reviews: ${await prisma.review.count()}`);
  console.log(`- Messages: ${await prisma.message.count()}`);
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
