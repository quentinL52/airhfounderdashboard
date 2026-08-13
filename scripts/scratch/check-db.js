const { PrismaClient } = require('@prisma/client');
const { decryptApiKey } = require('./src/lib/ai/api-key-encryption');

async function main() {
  const prisma = new PrismaClient();
  const settings = await prisma.aiSettings.findMany();
  console.log('AiSettings:', settings);
  
  if (settings.length > 0) {
    const dec = await decryptApiKey(settings[0].encryptedApiKey, settings[0].userId);
    console.log('Decrypted API Key:', dec);
  }
  
  await prisma.$disconnect();
}
main();
