import { adminProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';

import { addGameSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';
import { Prisma } from '@prisma/client';

export const procedure = adminProcedure
  .input(addGameSchema)
  .mutation(
    async ({
      input: {
        eventId,
        title,
        formatters,
        logoUrl,
        sortDirection,
        scoreFormat,
        aggregation,
      },
    }) => {
      const game = await prisma.game.create({
        data: {
          eventId,
          title,
          formatters,
          logoUrl,
          sortDirection,
          formatScore: scoreFormat,
          aggregation: aggregation ?? Prisma.JsonNull,
        },
        select: {
          id: true,
          title: true,
          logoUrl: true,
          formatters: true,
          sortDirection: true,
          formatScore: true,
          createdAt: true,
          updatedAt: true,
          eventId: true,
          aggregation: true,
        },
      });
      await pushEvent('game:added', { game });
      return game;
    },
  );
