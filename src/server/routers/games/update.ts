import { protectedProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { gameIdSchema, gameUpdateObject } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = protectedProcedure
  .input(
    z.object({
      id: gameIdSchema,
      updateObject: gameUpdateObject,
    }),
  )
  .mutation(async ({ input: { id, updateObject } }) => {
    await prisma.game.update({
      where: {
        id,
      },
      data: {
        title: updateObject.title,
      },
    });
    await pushEvent('game:updated', { id, updateObject });
  });
