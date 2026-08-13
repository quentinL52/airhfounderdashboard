import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill for V3 MVP...');
  
  // 1. Update existing contacts
  const contacts = await prisma.contact.updateMany({
    data: {
      dormant: false,
    }
  });
  console.log(`Updated ${contacts.count} contacts to set dormant=false.`);

  // 2. Update existing users to set default new fields if needed
  // For now, founderDeal and priceLockedForever default to false in Prisma,
  // but existing rows might need to be explicitly set if the DB allows nulls where it shouldn't.
  const users = await prisma.user.updateMany({
    data: {
      founderDeal: false,
      priceLockedForever: false
    }
  });
  console.log(`Updated ${users.count} users to set founderDeal=false.`);

  console.log('Backfill completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
