import { publicProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';
import { z } from 'zod';
import { eventIdSchema } from '~/server/schemas';

export const procedure = publicProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .query(async ({ input: { eventId } }) => {
    const games = await prisma.game.findMany({
      select: {
        id: true,
        title: true,
        formatters: true,
        logoUrl: true,
        sortDirection: true,
        formatScore: true,
        createdAt: true,
        updatedAt: true,
        eventId: true,
        aggregation: true,
      },
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return games;
  });
