import { adminProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { eventIdSchema, gameIdSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = adminProcedure
  .input(z.object({ eventId: eventIdSchema, id: gameIdSchema }))
  .mutation(async ({ input: { id } }) => {
    await prisma.game.delete({ where: { id } });
    await pushEvent('game:removed', { id });
  });
