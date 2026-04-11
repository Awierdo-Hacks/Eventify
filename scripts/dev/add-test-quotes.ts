import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from "@/lib/database-url";

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function addTestQuotes() {
  try {
    // Haal ALLE pending service requests op
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'QUOTED' },
        ],
      },
      include: {
        customer: true,
        provider: true,
        quotes: true,
      },
    });

    if (serviceRequests.length === 0) {
      console.log('Geen service requests gevonden. Maak eerst een aanvraag via de UI.');
      return;
    }

    console.log(`\n📋 ${serviceRequests.length} service request(s) gevonden:\n`);

    for (const serviceRequest of serviceRequests) {
      console.log(`- ${serviceRequest.event_type} voor ${serviceRequest.customer.name}`);
      console.log(`  ID: ${serviceRequest.id}`);
      console.log(`  Status: ${serviceRequest.status}`);
      console.log(`  Bestaande quotes: ${serviceRequest.quotes.length}`);
      
      // Skip als er al 3 of meer quotes zijn
      if (serviceRequest.quotes.length >= 3) {
        console.log(`  ⏭️  Heeft al ${serviceRequest.quotes.length} quotes, skip\n`);
        continue;
      }

      // Zoek de provider
      let provider;
      
      // Zoek een provider die nog geen quote heeft gegeven voor deze request
      const existingProviderIds = serviceRequest.quotes.map(q => q.provider_id);
      
      if (serviceRequest.provider_id && !existingProviderIds.includes(serviceRequest.provider_id)) {
        provider = await prisma.serviceProvider.findUnique({
          where: { id: serviceRequest.provider_id },
        });
      } else {
        // Zoek een andere provider in dezelfde categorie
        provider = await prisma.serviceProvider.findFirst({
          where: {
            category: serviceRequest.category,
            verified: true,
            id: {
              notIn: existingProviderIds,
            },
          },
        });
      }

      if (!provider) {
        console.log(`  ❌ Geen geschikte provider gevonden\n`);
        continue;
      }

      console.log(`  ✅ Provider: ${provider.business_name}`);

      // Maak een test quote
      const quote = await prisma.quote.create({
        data: {
          request_id: serviceRequest.id,
          provider_id: provider.id,
          total_price: Math.floor(Math.random() * 3000) + 1500, // Random prijs tussen 1500-4500
          included_services: [
            'Volledige service voor ' + serviceRequest.guest_count + ' personen',
            'Professionele uitvoering',
            'Alle benodigde apparatuur',
            'Setup en afbouw',
            'Persoonlijk consult vooraf',
          ],
          terms: 'Prijs is inclusief BTW. Aanbetaling van 30% vereist bij bevestiging.',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dagen
          message: `Premium ${serviceRequest.category} Pakket - Op maat gemaakt voor ${serviceRequest.event_type}`,
          accepted: false,
        },
      });

      console.log(`  💰 Quote aangemaakt: €${quote.total_price}`);

      // Update service request status naar QUOTED
      await prisma.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: { status: 'QUOTED' },
      });

      console.log(`  📝 Status updated naar QUOTED\n`);
    }

    console.log('\n✅ Klaar! Ga naar het customer dashboard om de quotes te zien en te accepteren.');
  } catch (error) {
    console.error('Error creating test quotes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestQuotes();
