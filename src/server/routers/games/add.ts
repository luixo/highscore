import { protectedProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import {
  gameTitleSchema,
  logoUrlSchema,
  formattersSchema,
} from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = protectedProcedure
  .input(
    z.object({
      title: gameTitleSchema,
      formatters: formattersSchema,
      logoUrl: logoUrlSchema,
    }),
  )
  .mutation(async ({ input: { title, formatters, logoUrl } }) => {
    const game = await prisma.game.create({
      data: {
        title,
        formatters,
        logoUrl,
      },
      select: {
        id: true,
        title: true,
        logoUrl: true,
        formatters: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await pushEvent('game:added', { game });
    return game;
  });
