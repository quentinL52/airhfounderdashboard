const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to', process.env.DATABASE_URL);
  // Check if a user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    });
  }

  // Create a due task
  const task = await prisma.scheduledTask.create({
    data: {
      userId: user.id,
      taskName: 'weekly_review',
      schedule: '0 0 * * 0', // weekly
      isActive: true,
      nextRunAt: new Date(Date.now() - 10000), // Due 10 seconds ago
      payload: {}
    }
  });

  console.log('Created due task:', task.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
