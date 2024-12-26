/**
 * Adds seed data to your db
 *
 * @see https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminKey = 'secret_key';
  await prisma.moderator.upsert({
    where: {
      key: adminKey,
    },
    create: {
      key: adminKey,
      name: 'Лёша',
      role: 'Admin',
    },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
