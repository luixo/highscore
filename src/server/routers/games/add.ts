import { adminProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';

import { addGameSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = adminProcedure
  .input(addGameSchema)
  .mutation(
    async ({
      input: { eventId, title, logoUrl, inputs, aggregation, formatting, sort },
    }) => {
      const game = await prisma.game.create({
        data: {
          eventId,
          title,
          logoUrl,
          inputs,
          aggregation,
          formatting,
          sort,
        },
        select: {
          eventId: true,
          id: true,
          title: true,
          logoUrl: true,
          inputs: true,
          aggregation: true,
          formatting: true,
          sort: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await pushEvent('game:added', { game });
      return game;
    },
  );
