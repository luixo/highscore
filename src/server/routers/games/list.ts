import { publicProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';

export const procedure = publicProcedure.query(async () => {
  const games = await prisma.game.findMany({
    select: {
      id: true,
      title: true,
      formatters: true,
      logoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {},
    orderBy: {
      createdAt: 'asc',
    },
  });
  return games;
});
