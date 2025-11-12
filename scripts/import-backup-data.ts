import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Start importing backup data...');

  // Dit script importeert de backup data naar de Render database
  // De data komt uit backup-data.sql maar we gebruiken Prisma om het te importeren
  
  try {
    // Test database connectie
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database verbonden');

    // Importeer de data met raw SQL
    // Je kunt hier je SQL statements toevoegen uit backup-data.sql
    // Maar zonder de \restrict commands
    
    console.log('📊 Checking current data...');
    const userCount = await prisma.user.count();
    const providerCount = await prisma.serviceProvider.count();
    const requestCount = await prisma.serviceRequest.count();
    const quoteCount = await prisma.quote.count();
    const bookingCount = await prisma.booking.count();
    const reviewCount = await prisma.review.count();
    
    console.log(`\nHuidige database status:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Providers: ${providerCount}`);
    console.log(`- Requests: ${requestCount}`);
    console.log(`- Quotes: ${quoteCount}`);
    console.log(`- Bookings: ${bookingCount}`);
    console.log(`- Reviews: ${reviewCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
