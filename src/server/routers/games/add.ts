import { adminProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import {
  gameTitleSchema,
  logoUrlSchema,
  formattersSchema,
  sortDirectionSchema,
  scoreFormatSchema,
  eventIdSchema,
} from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = adminProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
      title: gameTitleSchema,
      formatters: formattersSchema,
      logoUrl: logoUrlSchema,
      sortDirection: sortDirectionSchema,
      scoreFormat: scoreFormatSchema.optional(),
    }),
  )
  .mutation(
    async ({
      input: {
        eventId,
        title,
        formatters,
        logoUrl,
        sortDirection,
        scoreFormat,
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
        },
      });
      await pushEvent('game:added', { game });
      return game;
    },
  );
