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
        logoUrl: true,
        inputs: true,
        formatting: true,
        aggregation: true,
        sort: true,
        createdAt: true,
        updatedAt: true,
        eventId: true,
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
