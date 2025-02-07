import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { eventIdSchema } from '~/server/schemas';
import { adminProcedure } from '~/server/trpc';

export const procedure = adminProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .mutation(async ({ input: { eventId } }) => {
    await prisma.event.delete({ where: { id: eventId } });
  });
