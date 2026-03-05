import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function checkProviders() {
  const providers = await prisma.serviceProvider.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });

  console.log(`\n📋 ${providers.length} providers in database:\n`);
  
  providers.forEach(provider => {
    console.log(`- ${provider.business_name}`);
    console.log(`  Categorie: ${provider.category}`);
    console.log(`  Verified: ${provider.verified}`);
    console.log(`  Contact: ${provider.user.name} (${provider.user.email})`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkProviders();
