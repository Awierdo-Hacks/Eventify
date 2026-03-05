import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function createTestRequests() {
  try {
    // Vind Sarah Jansen (de klant die we gebruiken)
    const customer = await prisma.user.findUnique({
      where: { email: 'sarah.jansen@example.com' },
    });

    if (!customer) {
      console.log('❌ Sarah Jansen niet gevonden. Run eerst de seed script.');
      return;
    }

    console.log(`✅ Klant gevonden: ${customer.name}\n`);

    // Haal alle providers op
    const providers = await prisma.serviceProvider.findMany({
      where: { verified: true },
    });

    console.log(`📋 ${providers.length} providers beschikbaar\n`);

    // Maak nieuwe service requests aan
    const newRequests = [
      {
        category: 'catering' as const,
        event_type: 'Bedrijfsborrel',
        event_date: new Date('2025-12-15'),
        event_location: 'Amsterdam, Westpoort Business Center',
        guest_count: 75,
        budget_range: 'PREMIUM' as const,
        description: 'Jaarlijkse bedrijfsborrel met hapjes en drankjes voor 75 personen. We zoeken luxe catering met vegetarische opties.',
        additional_requirements: 'Vegetarische opties, glutenvrij, halal',
      },
      {
        category: 'photography' as const,
        event_type: 'Verlovingsshoot',
        event_date: new Date('2025-11-25'),
        event_location: 'Giethoorn',
        guest_count: 2,
        budget_range: 'MEDIUM' as const,
        description: 'Romantische verlovingsfotoshoot in Giethoorn. We willen graag foto\'s bij zonsondergang.',
        additional_requirements: 'Bewerkte foto\'s, online gallerij',
      },
      {
        category: 'dj' as const,
        event_type: 'Tuinfeest',
        event_date: new Date('2025-11-30'),
        event_location: 'Utrecht, Tuinwijk',
        guest_count: 50,
        budget_range: 'HIGH' as const,
        description: 'Gezellig tuinfeest met live muziek. We zoeken een DJ die populaire hits draait.',
        additional_requirements: 'Eigen geluidsapparatuur, 3-4 uur optreden',
      },
      {
        category: 'decoration' as const,
        event_type: 'Babyshower',
        event_date: new Date('2025-12-10'),
        event_location: 'Rotterdam, Blijdorp',
        guest_count: 30,
        budget_range: 'MEDIUM' as const,
        description: 'Schattige babyshower decoratie in pastelkleuren (roze en mint). Ballonnenboog, tafelversiering, photobooth.',
        additional_requirements: 'Setup en afbouw, photobooth props',
      },
    ];

    for (const requestData of newRequests) {
      // Vind een provider in de juiste categorie
      const provider = providers.find(p => p.category === requestData.category);
      
      if (!provider) {
        console.log(`⏭️  Geen provider gevonden voor ${requestData.category}`);
        continue;
      }

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
          budget_range: requestData.budget_range,
          description: requestData.description,
          status: 'PENDING',
        },
      });

      console.log(`✅ ${requestData.event_type} aangemaakt (${requestData.category})`);

      // Maak direct 2 offertes aan voor deze request
      const quote1Price = Math.floor(Math.random() * 1500) + 1500;
      const quote2Price = Math.floor(Math.random() * 1500) + 2000;

      await prisma.quote.create({
        data: {
          request_id: request.id,
          provider_id: provider.id,
          total_price: quote1Price,
          included_services: [
            'Standaard pakket',
            `Voor ${requestData.guest_count} personen`,
            'Professionele service',
            'Setup en afbouw',
            'Basis decoratie/materiaal',
          ],
          terms: 'Prijs is inclusief BTW. Aanbetaling van 30% vereist bij bevestiging. Annulering tot 14 dagen van tevoren mogelijk.',
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          message: `Basis ${requestData.category} Pakket`,
          accepted: false,
        },
      });

      console.log(`  💰 Offerte 1: €${quote1Price} (Basis pakket)`);

      // Tweede offerte van zelfde provider maar premium
      await prisma.quote.create({
        data: {
          request_id: request.id,
          provider_id: provider.id,
          total_price: quote2Price,
          included_services: [
            'Premium pakket',
            `Voor ${requestData.guest_count} personen`,
            'Luxe uitvoering',
            'Extra personeel',
            'Setup, afbouw en begeleiding',
            'Premium materialen/decoratie',
            'Gratis consult vooraf',
          ],
          terms: 'Prijs is inclusief BTW en alle extra services. Aanbetaling van 25% vereist bij bevestiging. Annulering tot 21 dagen van tevoren mogelijk.',
          valid_until: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          message: `Premium ${requestData.category} Pakket - All-inclusive`,
          accepted: false,
        },
      });

      console.log(`  💰 Offerte 2: €${quote2Price} (Premium pakket)`);

      // Update request status
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: { status: 'QUOTED' },
      });

      console.log(`  📝 Status: QUOTED\n`);
    }

    console.log('\n🎉 Klaar! Je hebt nu 4 nieuwe requests met elk 2 offertes om te testen!');
    console.log('Ga naar http://localhost:3000/dashboard om ze te bekijken.\n');
  } catch (error) {
    console.error('Error creating test requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRequests();
