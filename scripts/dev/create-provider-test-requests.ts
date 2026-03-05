import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function createProviderTestRequests() {
  try {
    // Vind Sarah Jansen (customer)
    const customer = await prisma.user.findUnique({
      where: { email: 'sarah.jansen@example.com' },
    });

    if (!customer) {
      console.log('❌ Sarah Jansen niet gevonden');
      return;
    }

    console.log(`✅ Klant: ${customer.name} (${customer.email})\n`);

    // Haal alle providers op
    const providers = await prisma.serviceProvider.findMany({
      where: { verified: true },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`📋 ${providers.length} verified providers gevonden\n`);

    // Maak voor ELKE provider een nieuwe aanvraag zonder quote
    const testRequests = [
      {
        category: 'catering',
        event_type: 'Zakelijk Diner',
        event_date: new Date('2025-12-20'),
        event_location: 'Amsterdam, Zuidas',
        guest_count: 30,
        budget_range: 'HIGH',
        description: 'Luxe zakelijk diner voor belangrijke klanten. We zoeken hoogwaardige catering met verfijnde menu opties. Vegetarische en glutenvrije opties vereist.',
      },
      {
        category: 'photography',
        event_type: 'Familiefotoshoot',
        event_date: new Date('2025-11-28'),
        event_location: 'Haarlem, Haarlemmerhout Park',
        guest_count: 6,
        budget_range: 'MEDIUM',
        description: 'Gezellige familiefotoshoot in het park met kinderen. We willen natuurlijke foto\'s in de herfstsfeer. Inclusief bewerking en online gallerij.',
      },
      {
        category: 'dj',
        event_type: 'Nieuwjaarsfeest',
        event_date: new Date('2025-12-31'),
        event_location: 'Utrecht, Evenementenlocatie',
        guest_count: 120,
        budget_range: 'PREMIUM',
        description: 'Groot nieuwjaarsfeest met DJ voor diverse muziekstijlen (80s, 90s, nu). Van 21:00 tot 03:00. Eigen licht en geluid systeem vereist.',
      },
      {
        category: 'decoration',
        event_type: 'Gala Avond',
        event_date: new Date('2026-01-15'),
        event_location: 'Rotterdam, Hotel New York',
        guest_count: 80,
        budget_range: 'PREMIUM',
        description: 'Elegante gala avond decoratie in zwart/goud thema. Inclusief tafeldecoratie, bloemen, verlichting en welkomstbord. Setup en afbouw vereist.',
      },
    ];

    let createdCount = 0;

    for (const requestData of testRequests) {
      // Vind provider voor deze categorie
      const provider = providers.find(p => p.category === requestData.category);
      
      if (!provider) {
        console.log(`⏭️  Geen provider gevonden voor ${requestData.category}\n`);
        continue;
      }

      // Maak service request aan
      const request = await prisma.serviceRequest.create({
        data: {
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: '+31612345678',
          provider_id: provider.id,
          category: requestData.category,
          event_type: requestData.event_type,
          event_date: requestData.event_date,
          event_location: requestData.event_location,
          guest_count: requestData.guest_count,
          budget_range: requestData.budget_range as any,
          description: requestData.description,
          status: 'PENDING',
        },
      });

      console.log(`✅ ${requestData.event_type} aangemaakt`);
      console.log(`   Provider: ${provider.business_name} (${provider.user.email})`);
      console.log(`   Datum: ${requestData.event_date.toLocaleDateString('nl-NL')}`);
      console.log(`   Gasten: ${requestData.guest_count}`);
      console.log(`   Budget: ${requestData.budget_range}`);
      console.log(`   ID: ${request.id}\n`);
      
      createdCount++;
    }

    console.log(`\n🎉 ${createdCount} nieuwe aanvragen aangemaakt voor providers!`);
    console.log(`\n📝 Test Flow:`);
    console.log(`1. Login als provider (bijv. DJ Mike: dj@mikeproductions.nl)`);
    console.log(`2. Ga naar Provider Dashboard`);
    console.log(`3. Zie nieuwe aanvraag in "Aanvragen" tab`);
    console.log(`4. Klik "Offerte Maken"`);
    console.log(`5. Vul prijs, services, voorwaarden in`);
    console.log(`6. Verstuur offerte`);
    console.log(`7. Login als Sarah Jansen (sarah.jansen@example.com)`);
    console.log(`8. Bekijk offerte in Customer Dashboard\n`);

  } catch (error) {
    console.error('Error creating test requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProviderTestRequests();
