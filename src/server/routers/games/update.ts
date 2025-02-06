import { adminProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { gameIdSchema, gameUpdateObject } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = adminProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      updateObject: gameUpdateObject,
    }),
  )
  .mutation(async ({ input: { gameId, updateObject } }) => {
    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        title: updateObject.title,
      },
    });
    await pushEvent('game:updated', { id: gameId, updateObject });
  });
