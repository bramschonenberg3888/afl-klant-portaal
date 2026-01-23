import { db as prisma } from '@/lib/db';

async function main() {
  // Create test users
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test Gebruiker',
      emailVerified: new Date(),
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@logistiekconcurrent.nl' },
    update: {},
    create: {
      email: 'admin@logistiekconcurrent.nl',
      name: 'Admin Beheerder',
      emailVerified: new Date(),
    },
  });

  console.log('Created test users:');
  console.log('  -', testUser.email);
  console.log('  -', adminUser.email);
  console.log('\nYou can login with either email and any password (6+ chars)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
